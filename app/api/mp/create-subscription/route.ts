export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PLAN_URLS = {
    micro: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=9dc55aabcb894382b10de65b5c09fdc7',
    basico: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=fe2bdde38c084335ab9e5fc87bf8b0fc',
    estandar: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=b6d7283d9dde4f08839001ca330fb676',
    premium: 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=0a847dfe67ae41e9b653e54d3917eba1'
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
    const planUrl = PLAN_URLS[planId as keyof typeof PLAN_URLS];

    if (!planUrl) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Agregamos external_reference para vincular el pago al comercio
    // Y payer_email para pre-llenar (si MP lo toma)
    const finalUrl = `${planUrl}&external_reference=${comercio.id}&payer_email=${user.email || ''}`;

    return NextResponse.json({ init_point: finalUrl });
}
