'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, AlertCircle, MessageCircle, Edit, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductUpload from '@/components/ProductUpload';
import type { Comercio, Producto } from '@/lib/types/database';

interface ProductsTabProps {
    comercio: Comercio;
    productos: Producto[];
    loading: boolean;
    onReload: () => void;
    onEdit: (product: Producto) => void;
}

export default function ProductsTab({ comercio, productos, loading, onReload, onEdit }: ProductsTabProps) {
    const router = useRouter();

    return (
        <div className="space-y-8">
            {/* Upload Form */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Cargar Nuevo Producto
                </h2>

                {/* Plan Limit Warning */}
                {(() => {
                    const limit = comercio.plan === 'premium' ? 100 :
                        comercio.plan === 'estandar' ? 50 :
                            comercio.plan === 'basico' ? 20 : 10;
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
                                            Has alcanzado el límite de {limit} productos del plan {(comercio.plan || 'prueba').toUpperCase()}.
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
                        onReload();
                        router.refresh(); // Keep router refresh for server components updates if any
                    }}
                />
            </div>

            {/* Product List */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Mis Productos
                </h2>

                {loading ? (
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
                                            onClick={() => onEdit(producto)}
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
    );
}
