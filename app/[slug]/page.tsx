import { createServerSupabaseClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CatalogClient from './CatalogClient';
import type { Comercio, Producto, Categoria } from '@/lib/types/database';

interface CatalogPageProps {
    params: Promise<{ slug: string }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    // Obtener comercio por slug
    const { data: comercio, error: comercioError } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', slug)
        .single<Comercio>();

    if (comercioError || !comercio) {
        notFound();
    }

    // SI ESTÁ SUSPENDIDA O MARCADA PARA BORRAR -> BLOQUEAR ACCESO PÚBLICO
    if (comercio.mp_status === 'suspended' || comercio.mp_status === 'to_delete') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full border border-gray-100">
                    <div className="mb-4 flex justify-center">
                        <div className="bg-gray-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Tienda No Disponible</h1>
                    <p className="text-gray-600 mb-6">
                        Esta tienda se encuentra temporalmente inactiva.
                        Por favor, intentá nuevamente más tarde.
                    </p>
                    <div className="w-16 h-1 bg-indigo-500 mx-auto rounded"></div>
                </div>
            </div>
        );
    }

    // Obtener categorías del comercio
    const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('comercio_id', comercio.id)
        .order('orden');

    const categoriasData: Categoria[] = categorias || [];

    // Obtener productos del comercio
    const { data: productos } = await supabase
        .from('productos')
        .select('*')
        .eq('comercio_id', comercio.id)
        .order('nombre');

    const productosData: Producto[] = productos || [];

    return (
        <CatalogClient
            comercio={comercio}
            productos={productosData}
            categorias={categoriasData}
        />
    );
}
