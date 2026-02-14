'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AlertCircle, LogOut, MessageCircle } from 'lucide-react';

export default function SuspendedPage() {
    const router = useRouter();
    const supabase = createClient();
    const [comercio, setComercio] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const { data: comercioData } = await supabase
                .from('comercios')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (comercioData) {
                setComercio(comercioData);

                // If account is active, redirect to dashboard
                if (comercioData.estado === 'activo') {
                    router.push('/admin/dashboard');
                }
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const isTrial = comercio?.meses_sin_pagar === 0;
    const whatsappUrl = `https://wa.me/5493416419999?text=Hola,%20necesito%20renovar%20mi%20suscripción%20de%20${comercio?.nombre}`;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 rounded-full p-4">
                        <AlertCircle className="w-16 h-16 text-red-600" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
                    Cuenta Suspendida
                </h1>

                {/* Message */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    {isTrial ? (
                        <div>
                            <p className="text-lg text-gray-800 mb-3">
                                Tu período de prueba gratuito de <strong>15 días</strong> ha finalizado.
                            </p>
                            <p className="text-gray-700">
                                Para continuar usando el servicio, necesitás contratar un plan mensual.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-lg text-gray-800 mb-3">
                                Tu suscripción ha vencido y el período de gracia de <strong>5 días</strong> ha finalizado.
                            </p>
                            <p className="text-gray-700">
                                Para reactivar tu cuenta, necesitás realizar el pago correspondiente.
                            </p>
                        </div>
                    )}
                </div>

                {/* Account Info */}
                {comercio && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-2">Información de tu cuenta:</h3>
                        <div className="space-y-1 text-sm text-gray-600">
                            <p><strong>Comercio:</strong> {comercio.nombre}</p>
                            <p><strong>Plan:</strong> {comercio.plan}</p>
                            {comercio.proximo_pago && (
                                <p><strong>Fecha de vencimiento:</strong> {new Date(comercio.proximo_pago).toLocaleDateString('es-AR')}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Plans */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Planes disponibles:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="border border-gray-200 rounded-lg p-3">
                            <h4 className="font-semibold text-sm text-gray-900">Básico</h4>
                            <p className="text-xs text-gray-600">20 productos</p>
                            <p className="text-lg font-bold text-blue-600 mt-1">$50.000/mes</p>
                        </div>
                        <div className="border border-blue-500 rounded-lg p-3 bg-blue-50">
                            <h4 className="font-semibold text-sm text-gray-900">Estándar</h4>
                            <p className="text-xs text-gray-600">50 productos</p>
                            <p className="text-lg font-bold text-blue-600 mt-1">$70.000/mes</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3">
                            <h4 className="font-semibold text-sm text-gray-900">Premium</h4>
                            <p className="text-xs text-gray-600">100 productos</p>
                            <p className="text-lg font-bold text-blue-600 mt-1">$80.000/mes</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Contactar por WhatsApp
                    </a>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </div>

                {/* Contact Info */}
                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>¿Necesitás ayuda? Contactanos al WhatsApp:</p>
                    <p className="font-semibold text-gray-900">341 641 9999</p>
                </div>
            </div>
        </div>
    );
}
