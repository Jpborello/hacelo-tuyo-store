export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Init Points de Planes obtenidos de plans_list.json (14/02/2026)
const PLAN_URLS = {
    'basico': 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=fe2bdde38c084335ab9e5fc87bf8b0fc',
    'estandar': 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=b6d7283d9dde4f08839001ca330fb676',
    'premium': 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=0a847dfe67ae41e9b653e54d3917eba1',
    // Plan de Prueba para Producción (20 ARS)
    'micro': 'https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=9dc55aabcb894382b10de65b5c09fdc7'
};

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { planId } = body;

        const { data: comercio } = await supabase
            .from('comercios')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

        // Validar Plan
        // Validar Plan ID
        const selectedPlanId = body.planId;
        const mpPlanId = PLAN_URLS[selectedPlanId as keyof typeof PLAN_URLS]?.split('preapproval_plan_id=')[1];

        if (!mpPlanId) {
            return NextResponse.json({ error: `Invalid plan ID: ${selectedPlanId}` }, { status: 400 });
        }

        console.log(`Creating dynamic subscription for Plan: ${selectedPlanId} (${mpPlanId})`);

        // Crear una solicitud de suscripción personalizada
        const preapproval = new PreApproval(client);

        const subscriptionData = {
            preapproval_plan_id: mpPlanId,
            payer_email: user.email, // Email sugerido, pero puede cambiarse en checkout
            external_reference: comercio.id, // ¡ESTO ES LO IMPORTANTE! Vincula el pago al comercio
            back_url: `https://hacelotuyo.com.ar/admin/dashboard`,
            reason: `Suscripción ${selectedPlanId.toUpperCase()} - Hacelo Tuyo`,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                organization_id: 'HACELOTUYO', // Opcional
                transaction_amount: selectedPlanId === 'micro' ? 20 : (selectedPlanId === 'basico' ? 50000 : (selectedPlanId === 'estandar' ? 70000 : 80000)),
                currency_id: 'ARS'
            },
            status: 'pending' // Estado inicial
        };

        const result = await preapproval.create({ body: subscriptionData });

        const finalUrl = result.init_point;
        console.log('Redirecting to Dynamic Init Point:', finalUrl);

        return NextResponse.json({ init_point: finalUrl });

    } catch (error: any) {
        console.error("========== SUBSCRIPTION ERROR ==========")
        console.error(error)

        return NextResponse.json({
            error: 'Internal server error',
            debug: {
                message: error.message || 'Unknown error',
                stack: error.stack || null
            }
        }, { status: 500 });
    }
}
