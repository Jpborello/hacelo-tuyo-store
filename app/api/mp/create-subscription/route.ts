export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

        // Definir montos manualmente (Estrategia Ad-Hoc)
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

        // Crear solicitud de suscripción personalizada (Ad-Hoc) vía FETCH directo para evitar problemas de SDK
        const subscriptionData = {
            payer_email: user.email || 'no-email@hacelotuyo.com.ar',
            external_reference: comercio.id,
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

        const response = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
            },
            body: JSON.stringify(subscriptionData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`MP API Error: ${result.message || JSON.stringify(result)}`);
        }

        const finalUrl = result.init_point;
        console.log('Redirecting to Dynamic Init Point:', finalUrl);

        return NextResponse.json({ init_point: finalUrl });

    } catch (error: any) {
        console.error("========== SUBSCRIPTION ERROR ==========")
        console.error(error)

        return NextResponse.json({
            error: 'Internal server error',
            debug: {
                message: error.message || String(error),
                details: error
            }
        }, { status: 500 });
    }
}
