import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { comercioId, items, total, formData } = body;

        // Basic validation
        if (!comercioId || !items || !items.length || !formData.nombre || !formData.direccion || !formData.telefono) {
            return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
        }

        const supabaseAdmin = createAdminClient();

        // Check if the store is active before creating the order
        const { data: comercio, error: comercioError } = await supabaseAdmin
            .from('comercios')
            .select('estado, mp_status')
            .eq('id', comercioId)
            .single();

        if (comercioError || !comercio || comercio.mp_status === 'suspended' || comercio.mp_status === 'to_delete') {
            return NextResponse.json({ error: 'La tienda no está disponible actualmente.' }, { status: 403 });
        }

        // 1. Insert Order (Pedido)
        const { data: pedido, error: pedidoError } = await supabaseAdmin
            .from('pedidos')
            .insert({
                comercio_id: comercioId,
                cliente_nombre: formData.nombre,
                direccion: formData.direccion,
                telefono: formData.telefono,
                cuit_dni: formData.cuitDni || null,
                total: total,
                estado: 'pendiente',
            })
            .select()
            .single();

        if (pedidoError) {
            console.error('Error creating order:', pedidoError);
            throw new Error('No se pudo crear el pedido');
        }

        // 2. Insert Order Details (Detalle Pedidos)
        const detalles = items.map((item: any) => ({
            pedido_id: pedido.id,
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
        }));

        const { error: detallesError } = await supabaseAdmin
            .from('detalle_pedidos')
            .insert(detalles);

        if (detallesError) {
            console.error('Error creating order details:', detallesError);
            throw new Error('No se pudieron crear los detalles del pedido');
        }

        return NextResponse.json({ 
            success: true, 
            pedidoId: pedido.id 
        });

    } catch (error: any) {
        console.error('Checkout API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
