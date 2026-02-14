'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const createDemoUser = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const supabase = createClient();

            // 1. Crear usuario
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: 'mayorista-test@hacelotuyo.com',
                password: 'Test123456!',
                options: {
                    data: {
                        name: 'Mayorista Test'
                    }
                }
            });

            if (signUpError) {
                if (signUpError.message.includes('already registered')) {
                    setError('El usuario ya existe. Intentá hacer login.');
                    return;
                }
                if (signUpError.message.includes('Database error')) {
                    setError('Error de base de datos. Ejecutá este comando en Supabase SQL Editor: DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
                    return;
                }
                throw signUpError;
            }

            if (!authData.user) {
                throw new Error('No se pudo crear el usuario');
            }

            setSuccess('¡Usuario creado! Esperá un momento...');

            // 2. Esperar un poco para asegurar que el usuario se creó
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 3. Crear comercio manualmente (porque el trigger está deshabilitado)
            const { error: comercioError } = await supabase
                .from('comercios')
                .insert({
                    user_id: authData.user.id,
                    nombre: 'Mayorista Test',
                    slug: 'mayorista-test'
                });

            if (comercioError) {
                console.error('Error creando comercio:', comercioError);

                // Si es un error de RLS, dar instrucciones claras
                if (comercioError.code === '42501' || comercioError.message.includes('policy')) {
                    setError('Error de permisos. Ejecutá este comando en Supabase SQL Editor para arreglar las políticas RLS: DROP POLICY IF EXISTS "Usuarios pueden crear su propio comercio" ON comercios; CREATE POLICY "Usuarios pueden crear su propio comercio" ON comercios FOR INSERT WITH CHECK (auth.uid() = user_id);');
                    return;
                }

                // Si el comercio ya existe, continuar
                if (!comercioError.message.includes('duplicate') && !comercioError.message.includes('unique')) {
                    throw new Error(`Error creando comercio: ${comercioError.message}`);
                }
            }

            // 4. Obtener el comercio
            const { data: comercio, error: getComercioError } = await supabase
                .from('comercios')
                .select('id')
                .eq('user_id', authData.user.id)
                .single();

            if (getComercioError || !comercio) {
                throw new Error('No se pudo obtener el comercio');
            }

            setSuccess('¡Comercio creado! Creando categorías...');

            // 5. Crear categorías
            const categorias = [
                { nombre: 'Todos', slug: 'todos', orden: 0 },
                { nombre: 'Almacén', slug: 'almacen', orden: 1 },
                { nombre: 'Chocolates', slug: 'chocolates', orden: 2 },
                { nombre: 'Golosinas', slug: 'golosinas', orden: 3 },
                { nombre: 'Bebidas', slug: 'bebidas', orden: 4 },
            ];

            const categoriasData = categorias.map(cat => ({
                ...cat,
                comercio_id: comercio.id
            }));

            const { error: catError } = await supabase
                .from('categorias')
                .upsert(categoriasData, { onConflict: 'comercio_id,slug' });

            if (catError) {
                console.error('Error creando categorías:', catError);
            }

            setSuccess('¡Todo listo! Redirigiendo al login...');

            // 6. Redirigir al login
            await new Promise(resolve => setTimeout(resolve, 2000));
            router.push('/login?message=Usuario creado exitosamente. Iniciá sesión.');

        } catch (err: any) {
            console.error('Error:', err);
            setError(err.message || 'Error creando el usuario demo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
                    Crear Usuario Demo
                </h1>
                <p className="text-gray-600 mb-6 text-center">
                    Hacelo Tuyo - Mayorista Test
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h2 className="font-semibold text-blue-900 mb-2">Credenciales:</h2>
                    <p className="text-sm text-blue-800">
                        <strong>Email:</strong> mayorista-test@hacelotuyo.com
                    </p>
                    <p className="text-sm text-blue-800">
                        <strong>Password:</strong> Test123456!
                    </p>
                    <p className="text-sm text-blue-800 mt-2">
                        <strong>Slug:</strong> mayorista-test
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                        {success}
                    </div>
                )}

                <button
                    onClick={createDemoUser}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creando usuario...
                        </>
                    ) : (
                        'Crear Usuario Demo'
                    )}
                </button>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        ¿Ya tenés cuenta?{' '}
                        <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                            Iniciá sesión
                        </a>
                    </p>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Qué se va a crear:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                        <li>✅ Usuario mayorista-test@hacelotuyo.com</li>
                        <li>✅ Comercio "Mayorista Test"</li>
                        <li>✅ 5 categorías (Almacén, Chocolates, Golosinas, etc.)</li>
                        <li>⚠️ Productos: Necesitás cargarlos manualmente</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
