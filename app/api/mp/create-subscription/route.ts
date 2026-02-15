export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

// IDs de Planes generados el 14/02/2026
const PLAN_IDS = {
    'basico': 'fe2bdde38c084335ab9e5fc87bf8b0fc',
    'estandar': 'b6d7283d9dde4f08839001ca330fb676',
    'premium': '0a847dfe67ae41e9b653e54d3917eba1'
};

export async function POST(req: Request) {
    let step = 'init';
    try {
        step = 'supabase_client';
        const supabase = await createServerSupabaseClient();

        step = 'supabase_auth';
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        step = 'parsing_body';
        const body = await req.json();
        const { planId, email } = body;

        step = 'fetching_comercio';
        const { data: comercio } = await supabase
            .from('comercios')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

        step = 'mp_config';
        if (!process.env.MP_ACCESS_TOKEN) {
            throw new Error('MP_ACCESS_TOKEN is missing');
        }

        console.log('Using MP Token:', process.env.MP_ACCESS_TOKEN.substring(0, 10) + '...');

        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN
        });

        // Validar Plan
        const preapprovalPlanId = PLAN_IDS[planId as keyof typeof PLAN_IDS];
        if (!preapprovalPlanId) {
            return NextResponse.json({ error: `Invalid plan ID: ${planId}` }, { status: 400 });
        }

        step = 'determine_payer_email';
        // Determinar si es TEST o PROD
        const isTest = process.env.MP_ACCESS_TOKEN.startsWith('TEST-');
        let payerEmail = '';

        if (isTest) {
            // En modo TEST, usamos el test user hardcodeado que sabemos que funciona o la variable
            payerEmail = process.env.MP_TEST_PAYER_EMAIL || 'test_user_2520602603@testuser.com';
            console.log('TEST MODE: Using Test Payer Email:', payerEmail);
        } else {
            // En PROD, usamos el email del usuario real o el que mande el frontend
            payerEmail = email || user.email;
            console.log('PROD MODE: Using User Email:', payerEmail);
        }

        if (!payerEmail) {
            return NextResponse.json({ error: 'payer_email is missing' }, { status: 400 });
        }

        step = 'mp_create_preapproval';
        const preapproval = new PreApproval(client);

        // URL fija que sabemos que funciona
        const backUrl = 'https://hacelo-tuyo-store-olhw.vercel.app/admin/dashboard';
        console.log('Back URL:', backUrl);

        console.log('Creating subscription with Plan ID:', preapprovalPlanId);

        const response = await preapproval.create({
            body: {
                preapproval_plan_id: preapprovalPlanId,
                payer_email: payerEmail,
                back_url: backUrl,
                status: 'pending', // o 'authorized' según la doc, pero pending suele ser el default para iniciar flujo
                external_reference: comercio.id
            }
        });

        if (!response.init_point) {
            throw new Error('No init_point returned from Mercado Pago');
        }

        return NextResponse.json({ init_point: response.init_point });

    } catch (error: any) {
        console.error("========== MP RAW ERROR ==========")
        console.error(error)
        console.error("========== MP RESPONSE ==========")
        console.error(error?.response)
        console.error("========== MP DATA ==========")
        console.error(error?.response?.data)

        return NextResponse.json({
            error: 'Internal server error',
            debug: {
                message: error.message || 'Unknown error',
                response: error.response?.data || null,
                status: error.response?.status || null,
                stack: error.stack || null
            },
            step_failed: step
        }, { status: 500 });
    }
}
