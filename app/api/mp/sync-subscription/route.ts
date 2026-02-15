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

        // 0️⃣ Obtener comercio (necesitamos el ID para buscar en MP)
        const { data: comercio } = await supabase
            .from('comercios')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

        // 1️⃣ Buscar suscripciones del usuario en MP por external_reference (MÁS SEGURO)
        // Usamos comercio.id que es lo que mandamos al crear la suscripción
        const mpRes = await fetch(
            `https://api.mercadopago.com/preapproval/search?external_reference=${comercio.id}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                },
            }
        );

        const mpData = await mpRes.json();

        if (!mpData?.results?.length) {
            return NextResponse.json({ status: 'no_subscription', message: 'No se encontró suscripción vinculada' });
        }

        // 2️⃣ Tomar la suscripción activa más reciente
        const active = mpData.results.find(
            (s: any) => s.status === 'authorized'
        );

        if (!active) {
            return NextResponse.json({ status: 'no_active_subscription', message: 'Suscripción encontrada pero no autorizada' });
        }

        // 3️⃣ Resolver plan por monto (convertido a número)
        const amount = Number(active.auto_recurring?.transaction_amount);

        const VALID_PLANS: Record<number, { plan: string; limite: number }> = {
            50000: { plan: 'basico', limite: 20 },
            70000: { plan: 'estandar', limite: 50 },
            80000: { plan: 'premium', limite: 100 }
        };

        const planInfo = VALID_PLANS[amount];

        if (!planInfo) {
            return NextResponse.json({
                status: 'no_active_subscription',
                message: 'Suscripción no válida o de prueba'
            });
        }

        const { plan, limite } = planInfo;

        // 4️⃣ Actualizar comercio en BD con verificación
        const { data: updatedData, error: updateError } = await supabase
            .from('comercios')
            .update({
                plan,
                limite_productos: limite,
                mp_subscription_id: active.id,
                mp_status: active.status,
                mp_next_payment_date: active.next_payment_date,
            })
            .eq('id', comercio.id)
            .select();

        if (updateError) {
            console.error('UPDATE ERROR', updateError);
            return NextResponse.json({ error: 'DB update failed', details: updateError }, { status: 500 });
        }

        if (!updatedData || updatedData.length === 0) {
            console.error('NO ROW UPDATED - RLS or ID mismatch');
            return NextResponse.json({ error: 'No se pudo actualizar el comercio' }, { status: 500 });
        }

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
