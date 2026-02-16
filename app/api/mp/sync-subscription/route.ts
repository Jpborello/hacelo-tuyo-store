export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

export async function POST() {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 0️⃣ Obtener comercio
        const { data: comercio } = await supabase
            .from('comercios')
            .select('id, creado_at')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

        // 1️⃣ Buscar PAGOS APROBADOS del usuario en MP por external_reference
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
        const payment = new Payment(client);

        const searchResult = await payment.search({
            options: {
                external_reference: comercio.id,
                status: 'approved',
                limit: 10,
                sort: 'date_created',
                criteria: 'desc'
            }
        });

        const payments = searchResult.results || [];

        if (payments.length === 0) {
            return NextResponse.json({ status: 'no_payment', message: 'No se encontraron pagos aprobados' });
        }

        // 2️⃣ Tomar el pago aprobado más reciente
        // (Ya viene ordenado por date_created desc, pero aseguramos)
        const lastPayment = payments[0];
        const paymentDate = new Date(lastPayment.date_created!);
        const now = new Date();

        // Calcular diferencia de días
        const diffTime = Math.abs(now.getTime() - paymentDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 3️⃣ Verificar si está vigente (30 días + 2 de gracia = 32)
        if (diffDays > 32) {
            console.log(`Último pago vencido: ${diffDays} días atrás. Downgrading...`);

            // ACTUALIZAR A PLAN GRATUITO (Downgrade)
            await supabase
                .from('comercios')
                .update({
                    plan: 'prueba',
                    limite_productos: 10,
                    mp_status: 'expired',
                    mp_next_payment_date: null
                })
                .eq('id', comercio.id);

            return NextResponse.json({
                status: 'expired',
                message: `Pago vencido hace ${diffDays} días. Plan degradado a Prueba.`,
                last_payment_date: lastPayment.date_created
            });
        }

        // 4️⃣ Resolver plan por monto pagado
        const amount = lastPayment.transaction_amount!;

        const VALID_PLANS: Record<number, { plan: string; limite: number }> = {
            50000: { plan: 'basico', limite: 20 },
            70000: { plan: 'estandar', limite: 50 },
            80000: { plan: 'premium', limite: 100 }
        };

        const planInfo = VALID_PLANS[amount];

        if (!planInfo) {
            return NextResponse.json({
                status: 'invalid_amount',
                message: `Monto pagado ($${amount}) no corresponde a un plan válido`
            });
        }

        const { plan, limite } = planInfo;

        // 5️⃣ Actualizar comercio en BD
        const { data: updatedData, error: updateError } = await supabase
            .from('comercios')
            .update({
                plan,
                limite_productos: limite,
                mp_subscription_id: lastPayment.id!.toString(), // Guardamos ID de pago en campo subscription (reuso)
                mp_status: 'authorized', // Simulamos status authorized
                mp_next_payment_date: new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Fecha + 30 días
            })
            .eq('id', comercio.id)
            .select();

        if (updateError) {
            console.error('UPDATE ERROR', updateError);
            return NextResponse.json({ error: 'DB update failed', details: updateError }, { status: 500 });
        }

        return NextResponse.json({
            status: 'updated',
            plan,
            payment_id: lastPayment.id,
            days_remaining: 32 - diffDays
        });

    } catch (error: any) {
        console.error('SYNC PAYMENT ERROR', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
