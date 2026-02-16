'use client';

import { useState } from 'react';
import { Clock, ChevronUp, ChevronDown, Printer, MessageCircle } from 'lucide-react';
import type { PedidoConDetalles } from '@/lib/types/database';

interface HistorialTabProps {
    pedidos: PedidoConDetalles[];
}

export default function HistorialTab({ pedidos }: HistorialTabProps) {
    const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

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

    const handlePrintOrder = (pedido: PedidoConDetalles) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        // Note: Using a shared print component or util would be better in the future
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
                    <h1>Detalles de Pedido</h1>
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

    return (
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
    );
}
