'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Package,
    ShoppingBag,
    LogOut,
    ExternalLink,
    Clock,
    Loader2,
    ChevronDown,
    ChevronUp,
    ShoppingCart,
    Printer,
    Edit,
    Check,
    MessageCircle,
    AlertCircle,
    Shield
} from 'lucide-react';
import ProductUpload from '@/components/ProductUpload';
import ProductEdit from '@/components/ProductEdit';
import PlanTab from './PlanTab';
import MetricasTab from './MetricasTab';
import type { Comercio, PedidoConDetalles, Producto } from '@/lib/types/database';

interface DashboardClientProps {
    comercio: Comercio;
    pedidos: PedidoConDetalles[];
}

export default function DashboardClient({ comercio, pedidos }: DashboardClientProps) {
    const router = useRouter();
    const supabase = createClient();
    const [activeTab, setActiveTab] = useState<'productos' | 'pedidos' | 'resumen' | 'metricas' | 'historial' | 'plan'>('productos');
    const [loggingOut, setLoggingOut] = useState(false);
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [catalogUrl, setCatalogUrl] = useState('');
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const [completingOrder, setCompletingOrder] = useState<string | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [acquiredProducts, setAcquiredProducts] = useState<Set<string>>(new Set());

    const toggleOrderExpanded = (orderId: string) => {
        setExpandedOrders(prev => {
            const next = new Set(prev);
            if (next.has(orderId)) {
                next.delete(orderId);
            } else {
                next.add(orderId);
            }
            return next;
        });
    };

    // Cargar productos adquiridos desde BD
    useEffect(() => {
        const loadAcquiredProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('productos_adquiridos')
                    .select('producto_id')
                    .eq('comercio_id', comercio.id);

                if (error) throw error;

                if (data) {
                    setAcquiredProducts(new Set(data.map(p => p.producto_id)));
                }
            } catch (error) {
                console.error('Error loading acquired products:', error);
            }
        };

        loadAcquiredProducts();
    }, [comercio.id]);

    // Obtener la URL del catálogo solo en el cliente
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCatalogUrl(`${window.location.origin}/${comercio.slug}`);
        }
    }, [comercio.slug]);

    // Cargar productos
    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('*')
                .eq('comercio_id', comercio.id)
                .order('creado_at', { ascending: false });

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleMarkAsProcessed = async (pedidoId: string) => {
        setProcessingOrder(pedidoId);
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: 'procesando' })
                .eq('id', pedidoId);

            if (error) throw error;

            // Refresh page
            router.refresh();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Error al actualizar el pedido');
        } finally {
            setProcessingOrder(null);
        }
    };

    const handlePrintOrder = (pedido: PedidoConDetalles) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pedido #${pedido.id.slice(0, 8)}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .header { margin-bottom: 20px; }
                    .total { font-weight: bold; font-size: 1.2em; margin-top: 20px; }
                    @media print {
                        button { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${comercio.nombre}</h1>
                    <p><strong>Pedido:</strong> #${pedido.id.slice(0, 8)}</p>
                    <p><strong>Fecha:</strong> ${new Date(pedido.creado_at).toLocaleDateString()}</p>
                    <p><strong>Cliente:</strong> ${pedido.cliente_nombre}</p>
                    <p><strong>Teléfono:</strong> ${pedido.telefono}</p>
                    <p><strong>Dirección:</strong> ${pedido.direccion}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedido.detalle_pedidos?.map(detalle => `
                            <tr>
                                <td>${detalle.productos.nombre}</td>
                                <td>${detalle.cantidad}</td>
                                <td>$${detalle.precio_unitario.toLocaleString()}</td>
                                <td>$${(detalle.cantidad * detalle.precio_unitario).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    Total: $${pedido.total.toLocaleString()}
                </div>
                
                <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Imprimir
                </button>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleMarkAsAcquired = async (productId: string) => {
        // Optimistic update
        const newAcquired = new Set(acquiredProducts);
        newAcquired.add(productId);
        setAcquiredProducts(newAcquired);

        try {
            const { error } = await supabase
                .from('productos_adquiridos')
                .insert({
                    comercio_id: comercio.id,
                    producto_id: productId
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving acquired product:', error);
            // Revert on error
            const reverted = new Set(acquiredProducts);
            reverted.delete(productId);
            setAcquiredProducts(reverted);
            alert('Error al guardar el producto como adquirido');
        }
    };

    const handleClearAcquired = async () => {
        if (!confirm('¿Estás seguro de querer limpiar la lista de productos adquiridos?')) return;

        // Optimistic update
        const previousState = new Set(acquiredProducts);
        setAcquiredProducts(new Set());

        try {
            const { error } = await supabase
                .from('productos_adquiridos')
                .delete()
                .eq('comercio_id', comercio.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error clearing acquired products:', error);
            // Revert on error
            setAcquiredProducts(previousState);
            alert('Error al limpiar la lista');
        }
    };

    const handleCompleteOrder = async (pedidoId: string) => {
        setCompletingOrder(pedidoId);
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: 'completado' })
                .eq('id', pedidoId);

            if (error) throw error;

            // Refresh page to show updated status
            router.refresh();
        } catch (error) {
            console.error('Error completing order:', error);
            alert('Error al finalizar el pedido');
        } finally {
            setCompletingOrder(null);
        }
    };

    const toggleOrderExpansion = (orderId: string) => {
        setExpandedOrders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orderId)) {
                newSet.delete(orderId);
            } else {
                newSet.add(orderId);
            }
            return newSet;
        });
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };



    const getEstadoBadge = (estado: string) => {
        const styles = {
            pendiente: 'bg-yellow-100 text-yellow-800',
            procesando: 'bg-blue-100 text-blue-800',
            entregado: 'bg-green-100 text-green-800',
        };
        return styles[estado as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    const getProductosTotales = () => {
        const productosMap = new Map<string, {
            producto: any;
            cantidadTotal: number;
            pedidosIds: Set<string>;
        }>();

        // Solo pedidos pendientes o procesando
        const pedidosActivos = pedidos.filter(p =>
            p.estado === 'pendiente' || p.estado === 'procesando'
        );

        pedidosActivos.forEach(pedido => {
            pedido.detalle_pedidos?.forEach(detalle => {
                // Usar el ID del producto anidado
                const key = detalle.productos.id;

                if (productosMap.has(key)) {
                    const existing = productosMap.get(key)!;
                    existing.cantidadTotal += detalle.cantidad;
                    existing.pedidosIds.add(pedido.id);
                } else {
                    productosMap.set(key, {
                        producto: detalle.productos,
                        cantidadTotal: detalle.cantidad,
                        pedidosIds: new Set([pedido.id])
                    });
                }
            });
        });

        return Array.from(productosMap.values())
            .map(item => ({
                producto: item.producto,
                cantidadTotal: item.cantidadTotal,
                numeroPedidos: item.pedidosIds.size
            }))
            .sort((a, b) => b.cantidadTotal - a.cantidadTotal);
    };

    const productosTotales = getProductosTotales();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {comercio.nombre}
                                </h1>
                                {/* Plan Badge */}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${comercio.plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                                    comercio.plan === 'estandar' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                    {comercio.plan || 'básico'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                                <p className="text-sm text-gray-500">Panel de Administración</p>
                                {/* Product Counter */}
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-gray-400" />
                                    <span className={`text-sm font-medium ${productos.length >= (
                                        comercio.plan === 'premium' ? 100 :
                                            comercio.plan === 'estandar' ? 50 : 20
                                    ) ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                        {productos.length}/{
                                            comercio.plan === 'premium' ? 100 :
                                                comercio.plan === 'estandar' ? 50 : 20
                                        } productos
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:bg-gray-400"
                        >
                            {loggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden md:inline">Salir</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Link al catálogo */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-gray-700 mb-2">Tu catálogo público:</p>
                        <a
                            href={catalogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            {catalogUrl}
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('productos')}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'productos'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Package className="w-5 h-5" />
                            Productos
                        </button>

                        <button
                            onClick={() => setActiveTab('pedidos')}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'pedidos'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Pedidos
                            {pedidos.filter(p => p.estado === 'pendiente').length > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                    {pedidos.filter(p => p.estado === 'pendiente').length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('resumen')}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'resumen'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Resumen de Compra
                        </button>

                        {/* Métricas Tab - Only for Standard and Premium */}
                        {(comercio.plan === 'estandar' || comercio.plan === 'premium') && (
                            <button
                                onClick={() => setActiveTab('metricas')}
                                className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'metricas'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Métricas
                            </button>
                        )}

                        <button
                            onClick={() => setActiveTab('historial')}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'historial'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Clock className="w-5 h-5" />
                            Historial
                        </button>

                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'plan'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Shield className="w-5 h-5" />
                            Mi Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="container mx-auto px-4 py-6">
                {activeTab === 'productos' && (
                    <div className="space-y-8">
                        {/* Upload Form */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Cargar Nuevo Producto
                            </h2>

                            {/* Plan Limit Warning */}
                            {(() => {
                                const limit = comercio.plan === 'premium' ? 100 :
                                    comercio.plan === 'estandar' ? 50 : 20;
                                const percentage = (productos.length / limit) * 100;

                                if (productos.length >= limit) {
                                    return (
                                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-red-900 mb-1">
                                                        Límite de productos alcanzado
                                                    </h3>
                                                    <p className="text-sm text-red-700 mb-3">
                                                        Has alcanzado el límite de {limit} productos del plan {(comercio.plan || 'básico').toUpperCase()}.
                                                        Mejorá tu plan para agregar más productos.
                                                    </p>
                                                    <a
                                                        href="https://wa.me/5491234567890?text=Hola!%20Quiero%20mejorar%20mi%20plan"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        Mejorar Plan
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                } else if (percentage >= 80) {
                                    return (
                                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-yellow-900 mb-1">
                                                        Cerca del límite
                                                    </h3>
                                                    <p className="text-sm text-yellow-700">
                                                        Estás usando {productos.length} de {limit} productos ({percentage.toFixed(0)}%).
                                                        Considerá mejorar tu plan pronto.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}

                            <ProductUpload
                                comercioSlug={comercio.slug}
                                onProductCreated={() => {
                                    loadProducts();
                                    router.refresh();
                                }}
                            />
                        </div>

                        {/* Product List */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Mis Productos
                            </h2>

                            {loadingProducts ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                                </div>
                            ) : productos.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-lg shadow">
                                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 text-lg">No hay productos todavía</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {productos.map((producto) => (
                                        <div
                                            key={producto.id}
                                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                                        >
                                            {producto.imagen_url && (
                                                <div className="relative h-48 bg-gray-100">
                                                    <Image
                                                        src={producto.imagen_url}
                                                        alt={producto.nombre}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-bold text-lg text-gray-900 mb-2">
                                                    {producto.nombre}
                                                </h3>
                                                {producto.descripcion && (
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {producto.descripcion}
                                                    </p>
                                                )}
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-2xl font-bold text-blue-600">
                                                        ${producto.precio.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        Stock: {producto.stock}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${producto.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {producto.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                    <button
                                                        onClick={() => setEditingProduct(producto)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                        Editar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'pedidos' && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Pedidos Recientes
                        </h2>

                        {pedidos.filter(p => p.estado !== 'completado').length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No hay pedidos pendientes</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pedidos
                                    .filter(p => p.estado !== 'completado')
                                    .map((pedido) => {
                                        // Formatear número de WhatsApp (quitar espacios, guiones, etc.)
                                        const whatsappNumber = pedido.telefono.replace(/[\s\-()]/g, '');
                                        const whatsappUrl = `https://wa.me/54${whatsappNumber}?text=Hola%20${encodeURIComponent(pedido.cliente_nombre)},%20tu%20pedido%20de%20$${pedido.total.toFixed(2)}%20está%20listo.`;

                                        return (
                                            <div
                                                key={pedido.id}
                                                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg text-gray-900">
                                                            {pedido.cliente_nombre}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">{pedido.direccion}</p>
                                                        <p className="text-sm text-gray-600">📱 {pedido.telefono}</p>
                                                        {pedido.cuit_dni && (
                                                            <p className="text-sm text-gray-600">🆔 {pedido.cuit_dni}</p>
                                                        )}
                                                    </div>

                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoBadge(
                                                            pedido.estado
                                                        )}`}
                                                    >
                                                        {pedido.estado.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Productos del Pedido */}
                                                {pedido.detalle_pedidos && pedido.detalle_pedidos.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                                        <button
                                                            onClick={() => toggleOrderExpansion(pedido.id)}
                                                            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition mb-2"
                                                        >
                                                            <span>Productos del Pedido ({pedido.detalle_pedidos.length})</span>
                                                            {expandedOrders.has(pedido.id) ? (
                                                                <ChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                        </button>

                                                        {/* Lista compacta de productos (siempre visible) */}
                                                        <div className="space-y-2 mb-3">
                                                            {pedido.detalle_pedidos.map((detalle) => (
                                                                <div
                                                                    key={detalle.id}
                                                                    className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg"
                                                                >
                                                                    {/* Imagen en miniatura */}
                                                                    <div className="flex-shrink-0 w-12 h-12 bg-white rounded-md overflow-hidden border border-gray-200">
                                                                        {detalle.productos.imagen_url ? (
                                                                            <img
                                                                                src={detalle.productos.imagen_url}
                                                                                alt={detalle.productos.nombre}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                                <Package className="w-6 h-6 text-gray-400" />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Info del producto */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-base font-medium text-gray-900 truncate">
                                                                            {detalle.productos.nombre}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-2xl font-bold text-blue-600">
                                                                                x{detalle.cantidad}
                                                                            </span>
                                                                            <span className="text-sm text-gray-500">
                                                                                × ${detalle.precio_unitario.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Subtotal */}
                                                                    <div className="text-lg font-bold text-gray-900">
                                                                        ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Detalles expandibles */}
                                                        {expandedOrders.has(pedido.id) && (
                                                            <div className="space-y-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                                {pedido.detalle_pedidos.map((detalle) => (
                                                                    <div
                                                                        key={`expanded-${detalle.id}`}
                                                                        className="bg-white p-3 rounded-lg shadow-sm"
                                                                    >
                                                                        <div className="flex gap-3">
                                                                            {/* Imagen más grande */}
                                                                            <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                                                                {detalle.productos.imagen_url ? (
                                                                                    <img
                                                                                        src={detalle.productos.imagen_url}
                                                                                        alt={detalle.productos.nombre}
                                                                                        className="w-full h-full object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                                        <Package className="w-10 h-10 text-gray-400" />
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Detalles completos */}
                                                                            <div className="flex-1">
                                                                                <h4 className="font-semibold text-gray-900 mb-1">
                                                                                    {detalle.productos.nombre}
                                                                                </h4>
                                                                                {detalle.productos.descripcion && (
                                                                                    <p className="text-xs text-gray-600 mb-2">
                                                                                        {detalle.productos.descripcion}
                                                                                    </p>
                                                                                )}
                                                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                                                                                        {detalle.productos.unidad_medida === 'bulto' ? '📦 Bulto' : '⚖️ Granel'}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        Cantidad: <strong className="text-2xl text-blue-600">{detalle.cantidad}</strong>
                                                                                    </span>
                                                                                    <span>Precio: <strong className="text-lg">${detalle.precio_unitario.toFixed(2)}</strong></span>
                                                                                </div>
                                                                                <div className="mt-2 text-sm font-bold text-blue-600">
                                                                                    Subtotal: ${(detalle.cantidad * detalle.precio_unitario).toFixed(2)}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 mb-3">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(pedido.creado_at).toLocaleDateString('es-AR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </div>

                                                    <span className="text-xl font-bold text-blue-600">
                                                        ${pedido.total.toFixed(2)}
                                                    </span>
                                                </div>

                                                {/* Botones de Acción */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {/* Botón Imprimir */}
                                                    <button
                                                        onClick={() => handlePrintOrder(pedido)}
                                                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                        Imprimir
                                                    </button>

                                                    {/* Botón Marcar como Procesado */}
                                                    {pedido.estado === 'pendiente' && (
                                                        <button
                                                            onClick={() => handleMarkAsProcessed(pedido.id)}
                                                            disabled={processingOrder === pedido.id}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {processingOrder === pedido.id ? (
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                            ) : (
                                                                <Check className="w-5 h-5" />
                                                            )}
                                                            Procesado
                                                        </button>
                                                    )}

                                                    {/* Botón Finalizar */}
                                                    {pedido.estado === 'procesando' && (
                                                        <button
                                                            onClick={() => handleCompleteOrder(pedido.id)}
                                                            disabled={completingOrder === pedido.id}
                                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {completingOrder === pedido.id ? (
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                            ) : (
                                                                <Check className="w-5 h-5" />
                                                            )}
                                                            Finalizar
                                                        </button>
                                                    )}

                                                    {/* Botón WhatsApp */}
                                                    <a
                                                        href={whatsappUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 ${pedido.estado === 'pendiente' ? '' : 'md:col-span-2'}`}
                                                    >
                                                        <MessageCircle className="w-5 h-5" />
                                                        WhatsApp
                                                    </a>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'resumen' && (
                    <div>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Resumen de Compra Total
                                </h2>
                                <p className="text-gray-600">
                                    Productos a comprar según pedidos pendientes y en proceso
                                </p>
                            </div>
                            {acquiredProducts.size > 0 && (
                                <button
                                    onClick={handleClearAcquired}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium"
                                >
                                    Limpiar Adquiridos ({acquiredProducts.size})
                                </button>
                            )}
                        </div>

                        {productosTotales.filter(item => !acquiredProducts.has(item.producto.id)).length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg shadow">
                                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">
                                    {productosTotales.length === 0
                                        ? 'No hay pedidos activos'
                                        : '¡Todos los productos fueron adquiridos!'}
                                </p>
                                {acquiredProducts.size > 0 && (
                                    <button
                                        onClick={handleClearAcquired}
                                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                                    >
                                        Ver todos nuevamente
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {productosTotales
                                    .filter(item => !acquiredProducts.has(item.producto.id))
                                    .map((item) => (
                                        <div
                                            key={item.producto.id}
                                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                                        >
                                            {/* Imagen del producto */}
                                            <div className="flex justify-center mb-4">
                                                <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                                                    {item.producto.imagen_url ? (
                                                        <img
                                                            src={item.producto.imagen_url}
                                                            alt={item.producto.nombre}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Package className="w-16 h-16 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Nombre del producto */}
                                            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
                                                {item.producto.nombre}
                                            </h3>

                                            {/* Cantidad GRANDE */}
                                            <div className="text-center mb-3">
                                                <div className="text-6xl font-bold text-blue-600 mb-2">
                                                    x{item.cantidadTotal}
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    De {item.numeroPedidos} pedido{item.numeroPedidos > 1 ? 's' : ''}
                                                </p>
                                            </div>

                                            {/* Tipo de unidad */}
                                            <div className="flex justify-center mb-4">
                                                <span className="bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700">
                                                    {item.producto.unidad_medida === 'bulto' ? '📦 Bulto' : '⚖️ Granel'}
                                                </span>
                                            </div>

                                            {/* Botón Adquirido */}
                                            <button
                                                onClick={() => handleMarkAsAcquired(item.producto.id)}
                                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                            >
                                                <Check className="w-5 h-5" />
                                                Adquirido
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab: Métricas */}
                {activeTab === 'metricas' && (
                    <MetricasTab comercioId={comercio.id} />
                )}

                {/* Tab: Historial */}
                {activeTab === 'historial' && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h2>
                        </div>

                        {pedidos.filter(p => p.estado === 'completado').length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    No hay pedidos completados
                                </h3>
                                <p className="text-gray-500">
                                    Los pedidos finalizados aparecerán aquí.
                                </p>
                            </div>
                        ) : (
                            Object.entries(
                                pedidos
                                    .filter(p => p.estado === 'completado')
                                    .reduce((groups, pedido) => {
                                        const date = new Date(pedido.creado_at).toLocaleDateString('es-AR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        });
                                        if (!groups[date]) {
                                            groups[date] = [];
                                        }
                                        groups[date].push(pedido);
                                        return groups;
                                    }, {} as Record<string, typeof pedidos>)
                            ).map(([date, groupPedidos]) => (
                                <div key={date}>
                                    <h3 className="text-lg font-bold text-gray-700 mb-4 capitalize border-b border-gray-200 pb-2">
                                        {date}
                                    </h3>
                                    <div className="space-y-4">
                                        {groupPedidos.map((pedido) => {
                                            const whatsappUrl = `https://wa.me/549${pedido.telefono.replace(/\D/g, '')}`;
                                            return (
                                                <div key={pedido.id} className="bg-white rounded-lg shadow-sm border-l-4 border-green-500 overflow-hidden">
                                                    <div className="p-4">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="text-xl font-bold text-gray-900">
                                                                        {pedido.cliente_nombre}
                                                                    </h3>
                                                                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase">
                                                                        ✓ Completado
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-600">{pedido.telefono}</p>
                                                                {pedido.direccion && (
                                                                    <p className="text-gray-500 text-sm mt-1">{pedido.direccion}</p>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-2xl font-bold text-gray-900">
                                                                    ${pedido.total.toFixed(2)}
                                                                </span>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {new Date(pedido.creado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Acordeón de productos para historial */}
                                                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                                                            <button
                                                                onClick={() => toggleOrderExpanded(pedido.id)}
                                                                className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition text-sm"
                                                            >
                                                                <span className="font-medium text-gray-700">
                                                                    Ver productos ({pedido.detalle_pedidos?.length || 0})
                                                                </span>
                                                                {expandedOrders.has(pedido.id) ? (
                                                                    <ChevronUp className="w-4 h-4 text-gray-500" />
                                                                ) : (
                                                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                                                )}
                                                            </button>

                                                            {expandedOrders.has(pedido.id) && (
                                                                <div className="p-3 border-t border-gray-200 bg-white">
                                                                    <ul className="space-y-2">
                                                                        {pedido.detalle_pedidos?.map((detalle) => (
                                                                            <li key={detalle.id} className="flex justify-between text-sm">
                                                                                <span className="text-gray-800">
                                                                                    {detalle.cantidad}x {detalle.productos.nombre}
                                                                                    {detalle.productos.unidad_medida === 'granel' && ' (kg)'}
                                                                                </span>
                                                                                <span className="text-gray-600 font-medium">
                                                                                    ${(detalle.cantidad * detalle.precio_unitario).toLocaleString()}
                                                                                </span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-3">
                                                                        <button
                                                                            onClick={() => handlePrintOrder(pedido)}
                                                                            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
                                                                        >
                                                                            <Printer className="w-4 h-4" />
                                                                            Imprimir
                                                                        </button>
                                                                        <a
                                                                            href={whatsappUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
                                                                        >
                                                                            <MessageCircle className="w-4 h-4" />
                                                                            WhatsApp
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                {/* Tab: Mi Plan */}
                {activeTab === 'plan' && (
                    <PlanTab comercio={comercio} productosCount={productos.length} />
                )}
            </main>

            {/* Product Edit Modal */}
            {editingProduct && (
                <ProductEdit
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onProductUpdated={() => {
                        loadProducts();
                        router.refresh();
                    }}
                />
            )}
        </div>
    );
}
