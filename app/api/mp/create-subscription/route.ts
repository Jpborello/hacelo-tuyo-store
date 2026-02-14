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

        step = 'mp_create_preapproval';
        const preapproval = new PreApproval(client);

        const backUrl = `${process.env.NEXT_PUBLIC_URL || 'https://hacelo-tuyo-store-olhw.vercel.app'}/admin/dashboard?status=approved`;
        console.log('Back URL:', backUrl);

        const response = await preapproval.create({
            body: {
                reason: reason,
                external_reference: comercio.id,
                payer_email: email || user.email || 'test_user_492421908@testuser.com',
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
        // Logs solicitados explícitamente por el usuario
        console.error("MP FULL ERROR ↓↓↓");
        console.error(error);
        console.error("MP RESPONSE DATA ↓↓↓");
        console.error(error?.response?.data);
        console.error("MP STATUS ↓↓↓");
        console.error(error?.response?.status);

        console.error('Mercado Pago Error at step ' + step + ':', error);

        const errorDetails = {
            message: error.message,
            cause: error.cause,
            response_data: error.response?.data, // Aquí suele estar el error de MP
            stack: error.stack
        };

        return NextResponse.json({
            error: `Failed at step: ${step}`,
            details: errorDetails
        }, { status: 500 });
    }
}
