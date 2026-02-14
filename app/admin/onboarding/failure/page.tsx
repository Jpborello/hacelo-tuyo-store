'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingFailurePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirigir después de 5 segundos
        const timeout = setTimeout(() => {
            router.push('/admin/dashboard');
        }, 5000);

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md">
                <div className="text-red-500 text-6xl mb-4">❌</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Pago Rechazado
                </h1>
                <p className="text-gray-600 mb-6">
                    Tu pago no pudo ser procesado. Por favor, intenta nuevamente.
                </p>
                <button
                    onClick={() => router.push('/admin/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                >
                    Volver al Dashboard
                </button>
                <p className="text-sm text-gray-500 mt-4">
                    Serás redirigido automáticamente en 5 segundos...
                </p>
            </div>
        </div>
    );
}
