'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Check, Package, Loader2 } from 'lucide-react';

const planes = [
    {
        id: 'basico',
        nombre: 'Básico',
        precio: 50000,
        limite: 20,
        descripcion: 'Ideal para empezar',
        features: [
            'Hasta 20 productos',
            'Catálogo online personalizado',
            'Gestión de pedidos',
            'WhatsApp integrado',
            'Soporte por email'
        ],
        popular: false
    },
    {
        id: 'estandar',
        nombre: 'Estándar',
        precio: 70000,
        limite: 50,
        descripcion: 'El más elegido',
        features: [
            'Hasta 50 productos',
            'Catálogo online personalizado',
            'Gestión de pedidos',
            'WhatsApp integrado',
            'Soporte prioritario',
            'Estadísticas básicas'
        ],
        popular: true
    },
    {
        id: 'premium',
        nombre: 'Premium',
        precio: 80000,
        limite: 100,
        descripcion: 'Para crecer sin límites',
        features: [
            'Hasta 100 productos',
            'Catálogo online personalizado',
            'Gestión de pedidos',
            'WhatsApp integrado',
            'Soporte 24/7',
            'Estadísticas avanzadas',
            'Reportes personalizados'
        ],
        popular: false
    }
];

export default function SelectPlanPage() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState<string>('estandar');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSelectPlan = async () => {
        try {
            setLoading(true);
            setError('');

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Obtener el comercio del usuario
            const { data: comercio, error: comercioError } = await supabase
                .from('comercios')
                .select('id, estado')
                .eq('user_id', user.id)
                .single();

            if (comercioError || !comercio) {
                setError('No se encontró tu comercio');
                setLoading(false);
                return;
            }

            // Actualizar el plan seleccionado
            await supabase
                .from('comercios')
                .update({ plan: selectedPlan })
                .eq('id', comercio.id);

            // Crear preferencia de pago
            const response = await fetch('/api/payments/alta', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    comercioId: comercio.id,
                    plan: selectedPlan
                })
            });

            if (!response.ok) {
                throw new Error('Error al crear preferencia de pago');
            }

            const data = await response.json();

            // Redirigir a Mercado Pago
            if (data.init_point) {
                window.location.href = data.init_point;
            } else {
                throw new Error('No se recibió URL de pago');
            }

        } catch (err) {
            console.error('Error:', err);
            setError('Error al procesar el pago. Por favor intenta nuevamente.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Elegí tu Plan
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        Seleccioná el plan que mejor se adapte a tu negocio
                    </p>
                    <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
                        Pago de Alta: $100,000 (una sola vez)
                    </div>
                </div>

                {/* Planes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {planes.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative bg-white rounded-2xl shadow-lg p-8 cursor-pointer transition-all hover:shadow-2xl ${selectedPlan === plan.id
                                    ? 'ring-4 ring-blue-600 scale-105'
                                    : 'hover:scale-102'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                                        Más Popular
                                    </span>
                                </div>
                            )}

                            {/* Radio button */}
                            <div className="flex justify-end mb-4">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id
                                        ? 'border-blue-600 bg-blue-600'
                                        : 'border-gray-300'
                                    }`}>
                                    {selectedPlan === plan.id && (
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    )}
                                </div>
                            </div>

                            {/* Plan info */}
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {plan.nombre}
                                </h3>
                                <p className="text-gray-600 mb-4">{plan.descripcion}</p>
                                <div className="mb-4">
                                    <span className="text-5xl font-bold text-gray-900">
                                        ${(plan.precio / 1000).toFixed(0)}k
                                    </span>
                                    <span className="text-gray-600">/mes</span>
                                </div>
                                <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                                    <Package className="w-5 h-5" />
                                    <span>Hasta {plan.limite} productos</span>
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                        {error}
                    </div>
                )}

                {/* Action button */}
                <div className="text-center">
                    <button
                        onClick={handleSelectPlan}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-12 rounded-xl text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                Continuar con {planes.find(p => p.id === selectedPlan)?.nombre}
                                <span className="text-sm opacity-90">
                                    (Pago de Alta: $100,000)
                                </span>
                            </>
                        )}
                    </button>
                    <p className="text-sm text-gray-500 mt-4">
                        Serás redirigido a Mercado Pago para completar el pago
                    </p>
                </div>

                {/* Info adicional */}
                <div className="mt-12 bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                        ℹ️ Información Importante
                    </h3>
                    <ul className="space-y-2 text-gray-700">
                        <li>• El pago de alta de $100,000 es <strong>único</strong> y te da acceso a la plataforma</li>
                        <li>• La cuota mensual se cobra automáticamente cada 30 días</li>
                        <li>• Podés cambiar de plan en cualquier momento</li>
                        <li>• Si alcanzás el límite de productos, podés hacer upgrade</li>
                        <li>• Todos los planes incluyen soporte y actualizaciones</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
