
import { useState, useEffect } from 'react';
import { Check, Star, Zap, Shield, MessageCircle, BarChart3, Store, Loader2, CreditCard } from 'lucide-react';
import { Comercio } from '@/lib/types/database';
import { useRouter } from 'next/navigation';

interface PlanTabProps {
    comercio: Comercio;
    productosCount: number;
}

const PLANS = [
    {
        id: 'prueba',
        name: 'Prueba Gratis (15 días)',
        price: 'Gratis',
        limit: 10,
        features: ['Hasta 10 productos', '15 días de prueba', 'Sin tarjeta de crédito'],
        color: 'green',
        icon: Store,
        hidden: true // Oculto en la lista de compra, pero visible en estado actual
    },
    {
        id: 'basico',
        name: 'Básico',
        price: '$50.000/mes',
        limit: 20,
        features: ['Hasta 20 productos', 'Catálogo online personalizado', 'Gestión de pedidos', 'WhatsApp integrado', 'Soporte por email'],
        color: 'blue',
        icon: Store,
        popular: true // Moved here
    },
    {
        id: 'estandar',
        name: 'Estándar',
        price: '$70.000/mes',
        limit: 50,
        features: ['Hasta 50 productos', 'Catálogo online personalizado', 'Gestión de pedidos', 'WhatsApp integrado', 'Soporte prioritario', 'Estadísticas básicas'],
        color: 'purple',
        icon: Zap
    },
    {
        id: 'premium',
        name: 'Premium',
        price: '$80.000/mes',
        limit: 100,
        features: ['Hasta 100 productos', 'Catálogo online personalizado', 'Gestión de pedidos', 'WhatsApp integrado', 'Soporte 24/7', 'Estadísticas avanzadas', 'Reportes personalizados'],
        color: 'orange',
        icon: Shield
    }
];

export default function PlanTab({ comercio, productosCount }: PlanTabProps) {
    const router = useRouter();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    // Sincronizar suscripción al montar el componente
    useEffect(() => {
        const syncSubscription = async () => {
            try {
                // Llamada al endpoint de sincronización
                const res = await fetch('/api/mp/sync-subscription', { method: 'POST' });
                const data = await res.json();

                if (data.status === 'updated' || data.status === 'expired') {
                    console.log('Plan actualizado/vencido desde Mercado Pago, refrescando vista...');
                    router.refresh();
                }
            } catch (error) {
                console.error('Error syncing subscription:', error);
            }
        };

        syncSubscription();
    }, [router]);

    const currentPlan = PLANS.find(p => p.id === (comercio.plan || 'prueba')) || PLANS[0];
    const isLimitReached = productosCount >= currentPlan.limit;
    const usagePercent = currentPlan.limit === 1000
        ? Math.min(100, (productosCount / 100) * 10) // Falso porcentaje para ilimitado
        : Math.min(100, (productosCount / currentPlan.limit) * 100);

    const handleUpgrade = async (planId: string) => {
        try {
            setLoadingPlan(planId);

            const response = await fetch('/api/mp/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    planId: planId
                }),
            });

            const data = await response.json();

            if (data.init_point) {
                // Redirigir a Mercado Pago
                window.location.href = data.init_point;
            } else {
                console.error('Subscription Error:', data);
                // Mostrar cualquier error que venga del backend (details, debug, error)
                const errorData = data.details || data.debug || data.error || 'Error desconocido';
                const detailsStr = typeof errorData === 'object' ? JSON.stringify(errorData, null, 2) : errorData;

                alert(`Error al iniciar suscripción: ${data.error || 'Error'}\n\nDetalles:\n${detailsStr}`);
                setLoadingPlan(null);
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con Mercado Pago');
            setLoadingPlan(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mi Plan</h2>
                    <p className="text-gray-600">Gestioná tu suscripción y desbloqueá más funcionalidades.</p>
                </div>
            </div>

            {/* Banner de Suspensión */}
            {(comercio.mp_status === 'suspended' || comercio.mp_status === 'to_delete') && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <Shield className="h-5 w-5 text-red-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                                Cuenta Suspendida
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                                <p>
                                    Tu período de servicio ha finalizado. Tu tienda ha sido desactivada temporalmente.
                                    Para reactivar tu sitio y volver a vender, por favor renová tu suscripción eligiendo un plan abajo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Banner de Gracia */}
            {comercio.mp_status === 'grace_period' && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <Zap className="h-5 w-5 text-orange-500" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-orange-800">
                                Renovación Pendiente
                            </h3>
                            <div className="mt-2 text-sm text-orange-700">
                                <p>
                                    Tu plan ha vencido recientemente. Tienes 5 días de gracia antes de que se suspenda el servicio.
                                    Por favor, realizá el pago para evitar interrupciones.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estado Actual */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Plan Actual: <span className="text-indigo-600 font-bold uppercase">{currentPlan.name}</span>
                        </h3>
                        {comercio.plan === 'prueba' ? (
                            <span className="text-xs px-2 py-1 rounded-full uppercase ml-2 bg-green-100 text-green-700">
                                Prueba Activa
                            </span>
                        ) : comercio.mp_status && (
                            <span className={`text-xs px-2 py-1 rounded-full uppercase ml-2 ${comercio.mp_status === 'active' || comercio.mp_status === 'authorized' ? 'bg-green-100 text-green-700' :
                                comercio.mp_status === 'grace_period' ? 'bg-orange-100 text-orange-700' :
                                    comercio.mp_status === 'suspended' ? 'bg-red-100 text-red-700 font-bold' :
                                        comercio.mp_status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                }`}>
                                {comercio.mp_status === 'grace_period' ? 'Renovación Pendiente' :
                                    comercio.mp_status === 'suspended' ? 'SUSPENDIDA' :
                                        comercio.mp_status}
                            </span>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                            {comercio.mp_next_payment_date
                                ? `Tu plan se renueva el ${new Date(comercio.mp_next_payment_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                                : 'Tu plan se renueva mensualmente automáticamente.'}
                        </p>
                    </div>

                    <div className="flex-1 max-w-md bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="font-medium text-gray-700">Uso de productos</span>
                            <span className={`${isLimitReached ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                                {productosCount} / {currentPlan.limit === 1000 ? '∞' : currentPlan.limit}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-2.5 rounded-full transition-all duration-500 ${isLimitReached ? 'bg-red-500' : 'bg-indigo-600'}`}
                                style={{ width: `${usagePercent}%` }}
                            ></div>
                        </div>
                        {isLimitReached && currentPlan.limit !== 1000 && (
                            <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                ¡Límite alcanzado! Mejorá tu plan.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Comparativa de Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.filter(p => !p.hidden).map((plan) => {
                    const isCurrent = plan.id === (comercio.plan || 'prueba');
                    const Icon = plan.icon;
                    const isLoading = loadingPlan === plan.id;

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-xl shadow-sm border transition-all hover:shadow-lg ${isCurrent
                                ? 'border-indigo-500 ring-1 ring-indigo-500 z-10 scale-[1.02]'
                                : 'border-gray-200 hover:border-indigo-300'
                                }`}
                        >
                            {/* Badge Popular (solo visual) */}
                            {plan.id === 'basico' && !isCurrent && (
                                <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-bl-lg border-b border-l border-orange-200">
                                    RECOMENDADO
                                </div>
                            )}

                            <div className="p-6 flex flex-col h-full">
                                <div className="mb-4">
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${plan.id === 'free' ? 'bg-gray-100 text-gray-600' :
                                        plan.id === 'basico' ? 'bg-blue-100 text-blue-600' :
                                            'bg-purple-100 text-purple-600'
                                        }`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                                    <div className="mt-2 flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start text-sm text-gray-600">
                                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {isCurrent ? (
                                    <button
                                        disabled
                                        className="w-full py-2.5 px-4 bg-gray-100 text-gray-500 font-semibold rounded-lg cursor-not-allowed border border-gray-200 text-sm"
                                    >
                                        Tu Plan Actual
                                    </button>
                                ) : plan.id === 'free' ? (
                                    <button
                                        disabled
                                        className="w-full py-2.5 px-4 bg-gray-50 text-gray-400 font-semibold rounded-lg border border-gray-100 text-sm"
                                    >
                                        Plan Básico
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUpgrade(plan.id)}
                                        disabled={loadingPlan !== null}
                                        className={`w-full py-2.5 px-4 font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm ${plan.id === 'premium'
                                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md'
                                            : 'bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                                            } ${loadingPlan !== null ? 'opacity-70 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="w-4 h-4" />
                                        )}
                                        {isLoading ? 'Procesando...' : 'Suscribirme'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
