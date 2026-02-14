'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const paymentId = searchParams.get('payment_id');
                const status = searchParams.get('status');

                if (status === 'approved') {
                    // Esperar un momento para que el webhook procese
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Verificar que la cuenta esté activa
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();

                    if (user) {
                        const { data: comercio } = await supabase
                            .from('comercios')
                            .select('estado')
                            .eq('user_id', user.id)
                            .single();

                        if (comercio?.estado === 'activo') {
                            setLoading(false);
                            // Redirigir al dashboard después de 3 segundos
                            setTimeout(() => {
                                router.push('/admin/dashboard');
                            }, 3000);
                        } else {
                            setError('El pago está siendo procesado. Por favor espera unos momentos.');
                            setTimeout(() => {
                                router.push('/admin/dashboard');
                            }, 5000);
                        }
                    }
                } else {
                    setError('El pago no fue aprobado');
                }
            } catch (err) {
                console.error('Error verifying payment:', err);
                setError('Error al verificar el pago');
            }
        };

        verifyPayment();
    }, [searchParams, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Procesando tu pago...
                    </h1>
                    <p className="text-gray-600">
                        Estamos activando tu cuenta. Esto puede tomar unos segundos.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                    <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {error}
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Serás redirigido al dashboard en unos momentos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
                <div className="text-green-500 text-6xl mb-4">✅</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    ¡Pago Exitoso!
                </h1>
                <p className="text-gray-600 mb-4">
                    Tu cuenta ha sido activada correctamente.
                </p>
                <p className="text-sm text-gray-500">
                    Serás redirigido al dashboard en unos segundos...
                </p>
            </div>
        </div>
    );
}

export default function OnboardingSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
