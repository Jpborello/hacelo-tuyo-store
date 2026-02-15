export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Inicializar cliente Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

// IDs de Planes (Preapproval Plan IDs)
const PLAN_IDS = {
    'basico': 'fe2bdde38c084335ab9e5fc87bf8b0fc',
    'estandar': 'b6d7283d9dde4f08839001ca330fb676',
    'premium': '0a847dfe67ae41e9b653e54d3917eba1',
    // Plan de Prueba (20 ARS)
    'micro': '9dc55aabcb894382b10de65b5c09fdc7'
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

        // Validar Plan ID
        const mpPlanId = PLAN_IDS[planId as keyof typeof PLAN_IDS];

        if (!mpPlanId) {
            return NextResponse.json({ error: `Invalid plan ID: ${planId}` }, { status: 400 });
        }

        console.log(`Creating dynamic subscription for Plan: ${planId} (${mpPlanId})`);

        // Crear una solicitud de suscripción personalizada
        const preapproval = new PreApproval(client);

        const subscriptionData: any = {
            preapproval_plan_id: mpPlanId,
            payer_email: user.email,
            external_reference: comercio.id, // VINCULACIÓN CRÍTICA
            back_url: 'https://hacelotuyo.com.ar/admin/dashboard',
            reason: `Suscripción ${planId.toUpperCase()} - Hacelo Tuyo`,
            status: 'pending'
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
                stack: error.stack || null,
                details: error.cause || error
            }
        }, { status: 500 });
    }
}
