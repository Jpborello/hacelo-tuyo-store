'use client';

import { ShoppingCart, Package, Check } from 'lucide-react';
import type { PedidoConDetalles, Producto } from '@/lib/types/database';

interface ResumenTabProps {
    pedidos: PedidoConDetalles[];
    acquiredProducts: Set<string>;
    onMarkAcquired: (productId: string) => void;
    onClearAcquired: () => void;
}

export default function ResumenTab({ pedidos, acquiredProducts, onMarkAcquired, onClearAcquired }: ResumenTabProps) {
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
        <div>
            <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                        onClick={onClearAcquired}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium w-full md:w-auto"
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
                            onClick={onClearAcquired}
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
                                    onClick={() => onMarkAcquired(item.producto.id)}
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
    );
}
