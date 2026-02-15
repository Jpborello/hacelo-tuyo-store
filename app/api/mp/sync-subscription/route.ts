export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1️⃣ Buscar suscripciones del usuario en MP
        const mpRes = await fetch(
            `https://api.mercadopago.com/preapproval/search?payer_email=${encodeURIComponent(user.email)}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                },
            }
        );

        const mpData = await mpRes.json();

        if (!mpData?.results?.length) {
            return NextResponse.json({ status: 'no_subscription' });
        }

        // 2️⃣ Tomar la suscripción activa más reciente
        const active = mpData.results.find(
            (s: any) => s.status === 'authorized'
        );

        if (!active) {
            return NextResponse.json({ status: 'no_active_subscription' });
        }

        // 3️⃣ Resolver plan por monto
        const amount = active.auto_recurring?.transaction_amount;

        let plan = 'basico';
        let limite = 15;

        if (amount === 20) {
            plan = 'micro';
            limite = 5;
        } else if (amount === 50000) {
            plan = 'basico';
            limite = 50;
        } else if (amount === 70000) {
            plan = 'estandar';
            limite = 75;
        } else if (amount === 80000) {
            plan = 'premium';
            limite = 100;
        }

        // 4️⃣ Actualizar comercio
        const { data: comercio } = await supabase
            .from('comercios')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

        await supabase
            .from('comercios')
            .update({
                plan,
                limite_productos: limite,
                mp_subscription_id: active.id,
                mp_status: active.status,
            })
            .eq('id', comercio.id);

        return NextResponse.json({
            status: 'updated',
            plan,
            mp_id: active.id,
        });

    } catch (error: any) {
        console.error('SYNC SUBSCRIPTION ERROR', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
