import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data } = body;

        // Soporte para ambos tipos de eventos según documentación y práctica
        if (type === 'subscription_preapproval' || type === 'preapproval') {
            console.log('Webhook MP: Preapproval received', data);

            // Lógica directa sin consultar SDK (según recomendación para evitar 500)
            const mpSubscriptionId = data.id;

            // Intentar obtener external_reference del body si viene
            const externalReference = body.external_reference || body.data?.external_reference;

            if (externalReference) {
                const supabase = await createServerSupabaseClient();

                // Determinar plan (esto es difícil sin transaction_amount si no viene en body)
                // Intentar deducir plan del body si es posible (ej: reason)
                let nuevoPlan = 'micro'; // Default seguro para este test

                if (body.reason?.includes('Básico')) nuevoPlan = 'basico';
                if (body.reason?.includes('Estándar')) nuevoPlan = 'estandar';
                if (body.reason?.includes('Premium')) nuevoPlan = 'premium';

                await supabase
                    .from('comercios')
                    .update({
                        mp_subscription_id: mpSubscriptionId,
                        mp_status: 'authorized',
                        plan: nuevoPlan,
                        limite_productos: nuevoPlan === 'premium' ? 100 : (nuevoPlan === 'basico' ? 50 : (nuevoPlan === 'estandar' ? 10 : 5))
                    })
                    .eq('id', externalReference);
            } else {
                console.warn('Webhook MP: No external_reference found in body, skipping update strictly as requested (No API Call).');
            }
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Webhook Handler Failed' }, { status: 500 });
    }
}
