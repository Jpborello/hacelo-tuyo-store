'use client';

import { useState } from 'react';
import { ShoppingBag, ChevronUp, ChevronDown, Package, Check, Loader2, Printer, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { PedidoConDetalles, Comercio } from '@/lib/types/database';

interface OrdersTabProps {
    pedidos: PedidoConDetalles[];
    comercio: Comercio;
}

export default function OrdersTab({ pedidos, comercio }: OrdersTabProps) {
    const router = useRouter();
    const supabase = createClient();
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const [completingOrder, setCompletingOrder] = useState<string | null>(null);

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

    const handleMarkAsProcessed = async (pedidoId: string) => {
        setProcessingOrder(pedidoId);
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ estado: 'procesando' })
                .eq('id', pedidoId);

            if (error) throw error;
            router.refresh();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Error al actualizar el pedido');
        } finally {
            setProcessingOrder(null);
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
            router.refresh();
        } catch (error) {
            console.error('Error completing order:', error);
            alert('Error al finalizar el pedido');
        } finally {
            setCompletingOrder(null);
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

    const getEstadoBadge = (estado: string) => {
        const styles = {
            pendiente: 'bg-yellow-100 text-yellow-800',
            procesando: 'bg-blue-100 text-blue-800',
            entregado: 'bg-green-100 text-green-800',
        };
        return styles[estado as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    return (
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

                                            {/* Mostrar detalles completos si está expandido */}
                                            {expandedOrders.has(pedido.id) && (
                                                <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-lg">
                                                    <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                                                        <span>Total del Pedido:</span>
                                                        <span>${pedido.total.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Botones de Acción */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-center font-medium transition flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            WhatsApp
                                        </a>

                                        <button
                                            onClick={() => handlePrintOrder(pedido)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>

                                        {pedido.estado === 'pendiente' && (
                                            <button
                                                onClick={() => handleMarkAsProcessed(pedido.id)}
                                                disabled={processingOrder === pedido.id}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {processingOrder === pedido.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Package className="w-4 h-4" />
                                                        Procesar
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {pedido.estado === 'procesando' && (
                                            <button
                                                onClick={() => handleCompleteOrder(pedido.id)}
                                                disabled={completingOrder === pedido.id}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {completingOrder === pedido.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check className="w-4 h-4" />
                                                        Finalizar
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
}
