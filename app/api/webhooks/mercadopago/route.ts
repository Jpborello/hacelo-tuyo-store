import { NextResponse } from 'next/server';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Soporte para ambos tipos de eventos según documentación y práctica
        if (type === 'subscription_preapproval' || type === 'preapproval') {
            console.log('Webhook MP: Preapproval received', data);

            // Inicializar cliente Mercado Pago dentro del handler para asegurar env vars
            const client = new MercadoPagoConfig({
                accessToken: process.env.MP_ACCESS_TOKEN || ''
            });

            const preapproval = new PreApproval(client);

            // Obtener detalles completos de la suscripción usando SDK
            // Esto es necesario porque el payload del webhook a veces viene incompleto
            const subscription = await preapproval.get({ id: data.id });

            // Validar external_reference (ID del comercio)
            const comercioId = subscription.external_reference;

            if (!comercioId) {
                console.log('Webhook MP: subscription has no external_reference, aborting update');
                return NextResponse.json({ status: 'ignored_no_ref' });
            }

            console.log(`Webhook MP: Updating subscription for Commerce ID: ${comercioId}, Status: ${subscription.status}`);

            const supabase = await createServerSupabaseClient();

            // Mapear el plan basado en el monto de la transacción
            // (Ya que el plan_id puede ser variable si cambiamos planes en MP)
            let nuevoPlan = null;
            const amount = subscription.auto_recurring?.transaction_amount;

            if (subscription.status === 'authorized') {
                if (amount === 20) {
                    nuevoPlan = 'micro';
                } else if (amount === 50000) {
                    nuevoPlan = 'basico';
                } else if (amount === 70000) {
                    nuevoPlan = 'estandar';
                } else if (amount === 80000) {
                    nuevoPlan = 'premium';
                } else {
                    // Si el monto no coincide, loguear para investigar, pero tal vez asignar default o mantener anterior?
                    // Asumiremos 'basico' si es mayor a 20? No, mejor no tocar si no sabemos.
                    console.log(`Webhook MP: Unknown amount ${amount}, plan assignment might be skipped or defaulted.`);
                }
            }

            // Actualizar en Supabase
            // Solo actualizamos si el estado es relevante (authorized, paused, cancelled)
            // Ojo: Si el estado NO es authorized, tal vez queramos "bajar" el plan?
            // Por ahora, nos enfocamos en activar (authorized).

            if (nuevoPlan) {
                await supabase
                    .from('comercios')
                    .update({
                        mp_subscription_id: subscription.id,
                        mp_status: subscription.status,
                        plan: nuevoPlan,
                        limite_productos: nuevoPlan === 'premium' ? 100 : (nuevoPlan === 'basico' ? 50 : (nuevoPlan === 'estandar' ? 10 : 15))
                    })
                    .eq('id', comercioId);
                console.log(`Webhook MP: Commerce ${comercioId} updated to Plan ${nuevoPlan}`);
            } else {
                // Si no hay nuevo plan (ej: status != authorized), actualizamos solo status?
                // Sí, para reflejar cancelaciones o pausas
                await supabase
                    .from('comercios')
                    .update({
                        mp_subscription_id: subscription.id,
                        mp_status: subscription.status
                    })
                    .eq('id', comercioId);
                console.log(`Webhook MP: Commerce ${comercioId} status updated to ${subscription.status} (Plan not changed)`);
            }
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
