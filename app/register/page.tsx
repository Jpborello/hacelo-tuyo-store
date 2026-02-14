'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        nombreComercio: '',
        slug: ''
    });

    useEffect(() => {
        // Obtener plan seleccionado del localStorage
        const plan = localStorage.getItem('selectedPlan') || 'estandar';
        setSelectedPlan(plan);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generar slug cuando cambia el nombre del comercio
        if (name === 'nombreComercio') {
            const slug = value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Validaciones
            if (formData.password !== formData.confirmPassword) {
                throw new Error('Las contraseñas no coinciden');
            }

            if (formData.password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            if (!formData.nombreComercio || !formData.slug) {
                throw new Error('Por favor completá todos los campos');
            }

            const supabase = createClient();

            // 1. Registrar usuario (sin confirmación de email)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${window.location.origin}/admin/dashboard`,
                    data: {
                        nombre_comercio: formData.nombreComercio
                    }
                }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('Error al crear usuario');

            // Esperar a que la sesión esté lista
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 2. Crear comercio con prueba gratis
            const fechaAlta = new Date();
            const proximoPago = new Date();
            proximoPago.setDate(proximoPago.getDate() + 15); // 15 días de prueba

            const { data: comercio, error: comercioError } = await supabase
                .from('comercios')
                .insert({
                    nombre: formData.nombreComercio,
                    slug: formData.slug,
                    user_id: authData.user.id,
                    estado: 'activo', // Activar inmediatamente
                    plan: selectedPlan,
                    fecha_alta: fechaAlta.toISOString(),
                    proximo_pago: proximoPago.toISOString().split('T')[0],
                    meses_sin_pagar: 0
                })
                .select()
                .single();

            if (comercioError) throw comercioError;

            // 3. Redirigir al dashboard
            router.push('/admin/dashboard');

        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message || 'Error al registrar. Por favor intenta nuevamente.');
            setLoading(false);
        }
    };

    const planNames: Record<string, string> = {
        basico: 'Básico',
        estandar: 'Estándar',
        premium: 'Premium'
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-md w-full">
                {/* Back button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a planes
                </Link>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Crear Cuenta
                        </h1>
                        <p className="text-gray-600">
                            Plan seleccionado: <span className="font-semibold text-blue-600">
                                {planNames[selectedPlan] || 'Estándar'}
                            </span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="tu@email.com"
                            />
                        </div>

                        {/* Nombre del Comercio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre de tu Comercio
                            </label>
                            <input
                                type="text"
                                name="nombreComercio"
                                value={formData.nombreComercio}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="Mi Distribuidora"
                            />
                        </div>

                        {/* Slug */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL de tu catálogo
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm">hacelotuyo.com/</span>
                                <input
                                    type="text"
                                    name="slug"
                                    value={formData.slug}
                                    onChange={handleChange}
                                    required
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                    placeholder="mi-distribuidora"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                                placeholder="Repetí tu contraseña"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                'Empezar Prueba Gratis (15 días)'
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <p className="text-center text-sm text-gray-600 mt-6">
                        ¿Ya tenés cuenta?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Iniciá sesión
                        </Link>
                    </p>
                </div>

                {/* Info */}
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                    <p className="font-semibold mb-1">✨ Prueba Gratis por 15 Días</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Sin tarjeta de crédito</li>
                        <li>Acceso completo a todas las funciones</li>
                        <li>Cancelá cuando quieras</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
