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
            .select('id, creado_at, plan, limite_productos')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });
        }

        // 🛡️ BYPASS PARA CUENTAS DE PRUEBA / ADMIN
        // Si es la cuenta andres@prueba.com (o admin), no sincronizar y dejar la cuenta como esté en BD
        const userEmail = user.email?.toLowerCase() || '';
        if (userEmail === 'andres@test' || userEmail === 'andres@prueba.com' || userEmail === process.env.ADMIN_EMAIL) {
            return NextResponse.json({
                status: 'bypassed',
                mp_status: 'active', // Forzar para la respuesta
                plan: comercio.plan,
                message: 'Cuenta administrativa o de prueba permanente.'
            });
        }

        // 1️⃣ Buscar PAGOS APROBADOS del usuario en MP por external_reference
        const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
        const payment = new Payment(client);

        const searchResult = await payment.search({
            options: {
                external_reference: comercio.id,
                status: 'approved',
                limit: 1, // Solo necesitamos el último
                sort: 'date_created',
                criteria: 'desc'
            }
        });

        const payments = searchResult.results || [];
        const lastPayment = payments[0];
        const now = new Date();

        let mp_status = 'authorized';
        let plan = comercio.plan;
        let limite = comercio.limite_productos;
        let mp_next_payment_date: string | null = null;
        let diffDays = 0;

        if (lastPayment) { // 🟢 USUARIO CON PAGOS PREVIOS
            const paymentDate = new Date(lastPayment.date_created!);
            const diffTime = Math.abs(now.getTime() - paymentDate.getTime());
            diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Calcular fecha renovación (Fecha pago + 30 días)
            const renewalDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            mp_next_payment_date = renewalDate.toISOString();

            if (diffDays <= 30) {
                mp_status = 'authorized'; // Al día
            } else if (diffDays <= 35) {
                mp_status = 'grace_period'; // 5 días de gracia (30-35)
            } else if (diffDays > 90) {
                mp_status = 'to_delete'; // 3 meses sin pagar
                plan = 'prueba'; // Downgrade visual
            } else {
                mp_status = 'suspended'; // Bloqueado (>35 días)
                plan = 'prueba'; // Downgrade visual
            }

            // Resolver plan si está activo o en gracia
            if (mp_status === 'authorized' || mp_status === 'grace_period') {
                const amount = lastPayment.transaction_amount!;
                const VALID_PLANS: Record<number, { plan: string; limite: number }> = {
                    30000: { plan: 'basico', limite: 30 },
                    40000: { plan: 'estandar', limite: 60 },
                    50000: { plan: 'premium', limite: 100 }
                };
                if (VALID_PLANS[amount]) {
                    plan = VALID_PLANS[amount].plan;
                    limite = VALID_PLANS[amount].limite;
                }
            }

        } else { // 🟡 USUARIO DE PRUEBA (Sin pagos)
            const created = new Date(comercio.creado_at);
            const diffTime = Math.abs(now.getTime() - created.getTime());
            const trialDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (trialDays > 15) {
                mp_status = 'suspended'; // Prueba vencida
            } else {
                mp_status = 'trial'; // En prueba
            }
            // Mantenemos plan actual (prueba)
        }

        // 5️⃣ Actualizar comercio en BD
        const { error: updateError } = await supabase
            .from('comercios')
            .update({
                plan,
                limite_productos: limite,
                mp_status: mp_status,
                mp_subscription_id: lastPayment?.id?.toString() || null,
                mp_next_payment_date: mp_next_payment_date,
            })
            .eq('id', comercio.id);

        if (updateError) {
            console.error('UPDATE ERROR', updateError);
            return NextResponse.json({ error: 'DB update failed', details: updateError }, { status: 500 });
        }

        return NextResponse.json({
            status: 'updated',
            mp_status,
            plan,
            message: `Estado actualizado a: ${mp_status}`
        });

    } catch (error: any) {
        console.error('SYNC PAYMENT ERROR', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
