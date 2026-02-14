'use client';

import { useState, useMemo } from 'react';
import { Search, ShoppingCart, Package, X, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/cart';
import CheckoutModal from './CheckoutModal';
import type { Comercio, Producto, Categoria } from '@/lib/types/database';

interface CatalogClientProps {
    comercio: Comercio;
    productos: Producto[];
    categorias: Categoria[];
}

export default function CatalogClient({ comercio, productos, categorias }: CatalogClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showCart, setShowCart] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const { items, addItem, updateQuantity, removeItem, getTotal, getItemCount, clearCart } = useCartStore();

    // Filtrar productos por categoría y búsqueda
    const filteredProducts = useMemo(() => {
        let filtered = productos;

        // Filtrar por categoría
        if (selectedCategory && selectedCategory !== 'todos') {
            filtered = filtered.filter((p) => p.categoria_id === selectedCategory);
        }

        // Filtrar por búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((p) =>
                p.nombre.toLowerCase().includes(query) ||
                p.descripcion?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [productos, selectedCategory, searchQuery]);

    const handleAddToCart = (producto: Producto) => {
        addItem({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen_url: producto.imagen_url || undefined,
            unidad_medida: producto.unidad_medida,
        });
    };

    const handleCheckout = () => {
        setShowCart(false);
        setShowCheckout(true);
    };

    const handleCheckoutSuccess = () => {
        clearCart();
        setShowCheckout(false);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                                {comercio.nombre}
                            </h1>
                            <p className="text-sm text-gray-500">Catálogo de Productos</p>
                        </div>

                        <button
                            onClick={() => setShowCart(true)}
                            className="relative bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-lg transition"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            {getItemCount() > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {getItemCount()}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Buscador */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        />
                    </div>

                    {/* Categorías */}
                    {categorias.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${selectedCategory === null
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Todos ({productos.length})
                            </button>
                            {categorias
                                .filter((cat) => cat.slug !== 'todos')
                                .map((categoria) => {
                                    const count = productos.filter((p) => p.categoria_id === categoria.id).length;
                                    return (
                                        <button
                                            key={categoria.id}
                                            onClick={() => setSelectedCategory(categoria.id)}
                                            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${selectedCategory === categoria.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                        >
                                            {categoria.nombre} ({count})
                                        </button>
                                    );
                                })}
                        </div>
                    )}
                </div>
            </header>

            {/* Lista de Productos */}
            <main className="container mx-auto px-4 py-6">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                            {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((producto) => (
                            <div
                                key={producto.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition"
                            >
                                {producto.imagen_url ? (
                                    <div className="relative h-48 bg-gray-100">
                                        <Image
                                            src={producto.imagen_url}
                                            alt={producto.nombre}
                                            fill
                                            className="object-contain p-2"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                                        <Package className="w-16 h-16 text-gray-400" />
                                    </div>
                                )}

                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                                        {producto.nombre}
                                    </h3>

                                    {producto.descripcion && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                            {producto.descripcion}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl font-bold text-blue-600">
                                            ${producto.precio.toFixed(2)}
                                        </span>
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {producto.unidad_medida}
                                        </span>
                                    </div>

                                    {(() => {
                                        const cartItem = items.find(item => item.id === producto.id);
                                        const quantity = cartItem?.cantidad || 0;

                                        if (quantity > 0) {
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(producto.id, quantity - 1)}
                                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
                                                    >
                                                        <Minus className="w-5 h-5" />
                                                    </button>
                                                    <div className="flex-1 bg-blue-100 text-blue-900 font-bold py-3 px-4 rounded-lg text-center text-lg">
                                                        {quantity}
                                                    </div>
                                                    <button
                                                        onClick={() => updateQuantity(producto.id, quantity + 1)}
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            );
                                        }

                                        return (
                                            <button
                                                onClick={() => handleAddToCart(producto)}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" />
                                                Agregar al Carrito
                                            </button>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Carrito Lateral */}
            {showCart && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setShowCart(false)}
                    />

                    <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
                        {/* Header del Carrito */}
                        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Mi Pedido</h2>
                            <button
                                onClick={() => setShowCart(false)}
                                className="p-2 hover:bg-blue-700 rounded-full transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Items del Carrito */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {items.length === 0 ? (
                                <div className="text-center py-12">
                                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">Tu carrito está vacío</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900 flex-1">
                                                    {item.nombre}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                                                        className="bg-white border border-gray-300 p-1 rounded hover:bg-gray-100"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </button>

                                                    <span className="font-semibold w-8 text-center">
                                                        {item.cantidad}
                                                    </span>

                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                                                        className="bg-white border border-gray-300 p-1 rounded hover:bg-gray-100"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <span className="font-bold text-blue-600">
                                                    ${(item.precio * item.cantidad).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer del Carrito */}
                        {items.length > 0 && (
                            <div className="border-t border-gray-200 p-4 space-y-3">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Total:</span>
                                    <span className="text-blue-600">${getTotal().toFixed(2)}</span>
                                </div>

                                <button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center gap-2"
                                    onClick={handleCheckout}
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Finalizar Pedido
                                </button>

                                <button
                                    onClick={clearCart}
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition"
                                >
                                    Vaciar Carrito
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Checkout Modal */}
            <CheckoutModal
                isOpen={showCheckout}
                onClose={() => setShowCheckout(false)}
                items={items}
                total={getTotal()}
                comercioId={comercio.id}
                onSuccess={handleCheckoutSuccess}
            />
        </div>
    );
}
