import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';
import type { Comercio, PedidoConDetalles } from '@/lib/types/database';

export default async function DashboardPage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Obtener comercio del usuario
    const { data: comercio } = await supabase
        .from('comercios')
        .select('*')
        .eq('user_id', user.id)
        .single<Comercio>();

    if (!comercio) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        No se encontró tu comercio
                    </h1>
                    <p className="text-gray-600">
                        Por favor, contacta al soporte.
                    </p>
                </div>
            </div>
        );
    }

    // Obtener pedidos activos (pendiente, procesando) para gestión y resumen
    const { data: pedidosActivos } = await supabase
        .from('pedidos')
        .select(`
            *,
            detalle_pedidos (
                id,
                cantidad,
                precio_unitario,
                productos (
                    id,
                    nombre,
                    descripcion,
                    imagen_url,
                    unidad_medida
                )
            )
        `)
        .eq('comercio_id', comercio.id)
        .in('estado', ['pendiente', 'procesando'])
        .order('creado_at', { ascending: false });

    // Obtener historial (completados, últimos 50)
    const { data: pedidosHistorial } = await supabase
        .from('pedidos')
        .select(`
            *,
            detalle_pedidos (
                id,
                cantidad,
                precio_unitario,
                productos (
                    id,
                    nombre,
                    descripcion,
                    imagen_url,
                    unidad_medida
                )
            )
        `)
        .eq('comercio_id', comercio.id)
        .eq('estado', 'completado')
        .order('creado_at', { ascending: false })
        .limit(50);

    const pedidosData: PedidoConDetalles[] = [
        ...(pedidosActivos || []),
        ...(pedidosHistorial || [])
    ];

    return <DashboardClient comercio={comercio} pedidos={pedidosData} />;
}
