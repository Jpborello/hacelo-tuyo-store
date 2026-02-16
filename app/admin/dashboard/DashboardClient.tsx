'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
    Package,
    ShoppingBag,
    LogOut,
    ExternalLink,
    Clock,
    Loader2,
    ShoppingCart,
    Shield,
    AlertCircle
} from 'lucide-react';
import ProductEdit from '@/components/ProductEdit';
import PlanTab from './PlanTab';
import MetricasTab from './MetricasTab';
import ProductsTab from './components/ProductsTab';
import OrdersTab from './components/OrdersTab';
import ResumenTab from './components/ResumenTab';
import HistorialTab from './components/HistorialTab';
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
    const [catalogUrl, setCatalogUrl] = useState('');
    const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [acquiredProducts, setAcquiredProducts] = useState<Set<string>>(new Set());

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

    const handleLogout = async () => {
        setLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const handleInitialPayment = async () => {
        try {
            const response = await fetch('/api/mp/create-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: comercio.plan })
            });
            const data = await response.json();
            if (data.init_point) window.location.href = data.init_point;
            else alert('Error: ' + (data.error || 'Desconocido'));
        } catch (error) {
            alert('Error al conectar con pago');
        }
    };

    if (['pendiente', 'suspendido', 'bloqueado'].includes(comercio.estado || '')) {
        let title = '';
        let message = '';
        let showPayment = true;

        if (comercio.estado === 'pendiente') {
            title = `Activá tu Plan ${comercio.plan?.toUpperCase()}`;
            message = 'Tu cuenta ha sido creada exitosamente. Para comenzar a utilizar la plataforma, por favor completá el pago de tu suscripción.';
        } else if (comercio.estado === 'suspendido') {
            title = 'Suscripción Vencida';
            message = 'Tu periodo de prueba o suscripción ha finalizado. Para continuar utilizando la plataforma, por favor regularizá tu pago.';
        } else {
            title = 'Cuenta Bloqueada';
            message = 'Tu cuenta ha sido bloqueada por administración. Por favor contactanos para más información.';
            showPayment = false;
        }

        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                    <p className="text-gray-600 mb-8">{message}</p>

                    {showPayment && (
                        <button
                            onClick={handleInitialPayment}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
                        >
                            Pagar Suscripción
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-md">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex-1 w-full md:w-auto">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate max-w-[200px] md:max-w-none">
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
                            <div className="flex flex-wrap items-center gap-4 mt-2">
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
                            className="w-full md:w-auto flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:bg-gray-400"
                        >
                            {loggingOut ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    <span>Salir</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Link al catálogo */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                        <p className="text-sm text-gray-700 mb-2">Tu catálogo público:</p>
                        <a
                            href={catalogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium truncate"
                        >
                            <span className="truncate">{catalogUrl}</span>
                            <ExternalLink className="w-4 h-4 flex-shrink-0" />
                        </a>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="container mx-auto px-4">
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        <button
                            onClick={() => setActiveTab('productos')}
                            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'productos'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Package className="w-5 h-5" />
                            Productos
                        </button>

                        <button
                            onClick={() => setActiveTab('pedidos')}
                            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'pedidos'
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
                            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'resumen'
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
                                className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'metricas'
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
                            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'historial'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <Clock className="w-5 h-5" />
                            Historial
                        </button>

                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`whitespace-nowrap flex-shrink-0 flex items-center gap-2 px-4 py-3 font-semibold border-b-2 transition ${activeTab === 'plan'
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
                    <ProductsTab
                        comercio={comercio}
                        productos={productos}
                        loading={loadingProducts}
                        onReload={loadProducts}
                        onEdit={setEditingProduct}
                    />
                )}

                {activeTab === 'pedidos' && (
                    <OrdersTab
                        pedidos={pedidos}
                        comercio={comercio}
                    />
                )}

                {activeTab === 'resumen' && (
                    <ResumenTab
                        pedidos={pedidos}
                        acquiredProducts={acquiredProducts}
                        onMarkAcquired={handleMarkAsAcquired}
                        onClearAcquired={handleClearAcquired}
                    />
                )}

                {/* Tab: Métricas */}
                {activeTab === 'metricas' && (
                    <MetricasTab comercioId={comercio.id} />
                )}

                {/* Tab: Historial */}
                {activeTab === 'historial' && (
                    <HistorialTab pedidos={pedidos} />
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
