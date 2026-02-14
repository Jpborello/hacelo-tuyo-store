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
