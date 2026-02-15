export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Inicializar cliente Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

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

        // Definir montos manualmente (Estrategia Ad-Hoc para garantizar external_reference e init_point)
        let amount = 0;
        let planName = '';

        if (planId === 'micro') {
            amount = 20;
            planName = 'Micro (Prueba)';
        } else if (planId === 'basico') {
            amount = 50000;
            planName = 'Básico';
        } else if (planId === 'estandar') {
            amount = 70000;
            planName = 'Estándar';
        } else if (planId === 'premium') {
            amount = 80000;
            planName = 'Premium';
        } else {
            return NextResponse.json({ error: `Invalid plan ID: ${planId}` }, { status: 400 });
        }

        console.log(`Creating Ad-Hoc subscription for Plan: ${planId} (${amount} ARS)`);

        // Crear solicitud de suscripción personalizada (Ad-Hoc)
        // Esto genera un init_point y permite external_reference sin exigir card_token_id
        const preapproval = new PreApproval(client);

        const subscriptionData: any = {
            payer_email: user.email,
            external_reference: comercio.id, // VINCULACIÓN CRÍTICA
            back_url: 'https://hacelotuyo.com.ar/admin/dashboard',
            reason: `Suscripción Plan ${planName} - Hacelo Tuyo`,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: amount,
                currency_id: 'ARS'
            },
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
