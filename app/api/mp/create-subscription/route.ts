import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
        const { planId, email } = body; // planId: 'basico' | 'premium'

        // Obtener comercio
        const { data: comercio } = await supabase
            .from('comercios')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

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

        const preapproval = new PreApproval(client);

        const response = await preapproval.create({
            body: {
                reason: reason,
                external_reference: comercio.id, // Vinculamos la suscripción al ID del comercio
                payer_email: email || user.email || 'test_user_123@testuser.com', // Email del pagador (debe ser un user de prueba en Sandbox)
                auto_recurring: {
                    frequency: 1,
                    frequency_type: 'months',
                    transaction_amount: transactionAmount,
                    currency_id: 'ARS'
                },
                back_url: `${process.env.NEXT_PUBLIC_URL || 'https://tu-dominio.vercel.app'}/admin/dashboard?status=approved`,
                status: 'pending'
            }
        });

        if (!response.init_point) {
            throw new Error('No init_point returned from Mercado Pago');
        }

        return NextResponse.json({ init_point: response.init_point });

    } catch (error: any) {
        console.error('Mercado Pago Error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message || JSON.stringify(error)
        }, { status: 500 });
    }
}
