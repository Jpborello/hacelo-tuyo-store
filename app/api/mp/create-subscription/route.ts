import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

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

        // Loguear parcialmente el token para debug
        console.log('Using MP Token:', process.env.MP_ACCESS_TOKEN.substring(0, 10) + '...');

        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN
        });

        let transactionAmount = 0;
        let reason = '';

        if (planId === 'basico') {
            transactionAmount = 50000;
            reason = 'Plan Básico (Hacelo Tuyo)';
        } else if (planId === 'estandar') {
            transactionAmount = 70000;
            reason = 'Plan Estándar (Hacelo Tuyo)';
        } else if (planId === 'premium') {
            transactionAmount = 80000;
            reason = 'Plan Premium (Hacelo Tuyo)';
        } else {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }



        step = 'determine_payer_email';
        // Determinar si es TEST o PROD
        const isTest = process.env.MP_ACCESS_TOKEN.startsWith('TEST-');
        let payerEmail = '';

        if (isTest) {
            // En modo TEST, forzamos el uso de un email de prueba válido
            // Prioridad: variable de entorno > hardcoded fallback
            payerEmail = process.env.MP_TEST_PAYER_EMAIL || 'test_user_492421908@testuser.com';
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

        const backUrl = `${process.env.NEXT_PUBLIC_URL || 'https://hacelo-tuyo-store-olhw.vercel.app'}/admin/dashboard?status=approved`;
        console.log('Back URL:', backUrl);

        const response = await preapproval.create({
            body: {
                reason: reason,
                external_reference: comercio.id,
                payer_email: payerEmail,
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: transactionAmount,
                    currency_id: 'ARS'
                },
                back_url: backUrl,
                status: 'pending'
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
        console.error("========== MP STATUS ==========")
        console.error(error?.response?.status)

        return NextResponse.json({
            error: 'Internal server error',
            debug: error?.response?.data || error.message || error,
            step_failed: step // Mantengo esto porque es útil
        }, { status: 500 });
    }
}
