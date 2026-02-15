import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Soporte para ambos tipos de eventos según documentación y práctica
        if (type === 'subscription_preapproval' || type === 'preapproval') {
            const preapproval = new PreApproval(client);
            const subscription = await preapproval.get({ id: data.id });

            // subscription.status: authorized, paused, cancelled
            // subscription.external_reference: comercio_id

            if (subscription.external_reference) {
                const supabase = await createServerSupabaseClient();

                // Mapear estado de MP a nuestro estado
                // authorized -> activo
                // paused -> suspendido (o activo pero con aviso)
                // cancelled -> cancelado/básico

                let nuevoPlan = null;
                // Si está autorizado y el monto coincide con los planes, asignar plan
                if (subscription.status === 'authorized') {
                    // Actualizar Plan basado en montos nuevos (14/02/2026)
                    const amount = subscription.auto_recurring?.transaction_amount;

                    if (amount === 20) {
                        nuevoPlan = 'micro';
                    } else if (amount === 50000) {
                        nuevoPlan = 'basico';
                    } else if (amount === 70000) {
                        nuevoPlan = 'estandar';
                    } else if (amount === 80000) {
                        nuevoPlan = 'premium';
                    }
                }

                await supabase
                    .from('comercios')
                    .update({
                        mp_subscription_id: subscription.id,
                        mp_status: subscription.status,
                        plan: nuevoPlan as any, // Actualiza el plan si está activo
                        limite_productos: nuevoPlan === 'premium' ? 100 : (nuevoPlan === 'basico' ? 50 : 15)
                    })
                    .eq('id', subscription.external_reference);
            }
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
