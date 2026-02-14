'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2, ShoppingCart } from 'lucide-react';
import type { CartItem } from '@/lib/store/cart';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    total: number;
    comercioId: string;
    onSuccess: () => void;
}

export default function CheckoutModal({
    isOpen,
    onClose,
    items,
    total,
    comercioId,
    onSuccess,
}: CheckoutModalProps) {
    const supabase = createClient();

    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        cuitDni: '',
        telefono: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validaciones
            if (!formData.nombre || !formData.direccion || !formData.telefono) {
                throw new Error('Por favor completá todos los campos obligatorios');
            }

            if (items.length === 0) {
                throw new Error('El carrito está vacío');
            }

            // Crear pedido
            const { data: pedido, error: pedidoError } = await supabase
                .from('pedidos')
                .insert({
                    comercio_id: comercioId,
                    cliente_nombre: formData.nombre,
                    direccion: formData.direccion,
                    telefono: formData.telefono,
                    cuit_dni: formData.cuitDni || null,
                    total: total,
                    estado: 'pendiente',
                })
                .select()
                .single();

            if (pedidoError) throw pedidoError;

            // Crear detalles del pedido
            const detalles = items.map((item) => ({
                pedido_id: pedido.id,
                producto_id: item.id,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
            }));

            const { error: detallesError } = await supabase
                .from('detalle_pedidos')
                .insert(detalles);

            if (detallesError) throw detallesError;

            // Éxito
            alert('¡Pedido enviado exitosamente! El mayorista se contactará pronto.');
            onSuccess();
            onClose();

            // Limpiar formulario
            setFormData({
                nombre: '',
                direccion: '',
                cuitDni: '',
                telefono: '',
            });
        } catch (err: any) {
            setError(err.message || 'Error al procesar el pedido');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                        disabled={loading}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Resumen del pedido */}
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Resumen del Pedido</h3>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-700">
                                        {item.nombre} x{item.cantidad}
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        ${(item.precio * item.cantidad).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span className="text-blue-600">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nombre Completo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Juan Pérez"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Dirección de Entrega *
                            </label>
                            <input
                                type="text"
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Av. Corrientes 1234, CABA"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* CUIT/DNI */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CUIT o DNI (Opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.cuitDni}
                                onChange={(e) => setFormData({ ...formData, cuitDni: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="20-12345678-9 o 12345678"
                                disabled={loading}
                            />
                        </div>

                        {/* Celular */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Celular (WhatsApp) *
                            </label>
                            <input
                                type="tel"
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="11 1234-5678"
                                required
                                disabled={loading}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                El mayorista se contactará por WhatsApp para confirmar tu pedido
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition disabled:bg-gray-100"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    'Confirmar Pedido'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
