export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PLAN_IDS = {
    micro: '9dc55aabcb894382b10de65b5c09fdc7',
    basico: 'fe2bdde38c084335ab9e5fc87bf8b0fc',
    estandar: 'b6d7283d9dde4f08839001ca330fb676',
    premium: '0a847dfe67ae41e9b653e54d3917eba1'
};

export async function POST(req: Request) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: comercio } = await supabase
        .from('comercios')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!comercio) {
        return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
    }

    const body = await req.json();
    const { planId } = body;
    const preapprovalPlanId = PLAN_IDS[planId as keyof typeof PLAN_IDS];

    if (!preapprovalPlanId) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Crear suscripción dinámicamente vía API
    try {
        const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                preapproval_plan_id: preapprovalPlanId,
                reason: `Plan ${planId.charAt(0).toUpperCase() + planId.slice(1)} - Hacelo Tuyo`,
                external_reference: comercio.id, // VINCULACIÓN CLAVE
                payer_email: user.email,
                back_url: 'https://hacelotuyo.com.ar/admin/dashboard',
                status: 'pending' // <--- CAMBIO VITAL: "pending" no pide tarjeta
                // QUITAMOS el objeto 'auto_recurring' de aquí 
                // porque ya viene definido dentro del 'preapproval_plan_id'
            })
        });

        const mpData = await mpRes.json();

        if (!mpData.init_point) {
            console.error('MP API Error:', mpData);
            return NextResponse.json({ error: 'Error creating subscription', details: mpData }, { status: 500 });
        }

        return NextResponse.json({ init_point: mpData.init_point });

    } catch (error) {
        console.error('Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
