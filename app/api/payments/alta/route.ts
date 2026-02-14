import { createServerSupabaseClient } from '@/lib/supabase/server';
import { preferenceClient } from '@/lib/mercadopago/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
        }

        const { comercioId, plan } = await request.json();

        // Verificar que el comercio pertenece al usuario
        const { data: comercio, error: comercioError } = await supabase
            .from('comercios')
            .select('*')
            .eq('id', comercioId)
            .eq('user_id', user.id)
            .single();

        if (comercioError || !comercio) {
            return NextResponse.json({ error: 'Comercio no encontrado' }, { status: 404 });
        }

        // Crear preferencia de pago de alta
        const preference = await preferenceClient.create({
            body: {
                items: [{
                    id: 'alta',
                    title: 'Pago de Alta - Hacelotuyo',
                    description: `Alta del comercio ${comercio.nombre}`,
                    quantity: 1,
                    unit_price: 100000,
                    currency_id: 'ARS'
                }],
                external_reference: comercioId,
                metadata: {
                    comercio_id: comercioId,
                    tipo: 'alta',
                    plan: plan
                },
                back_urls: {
                    success: `${process.env.NEXT_PUBLIC_URL}/admin/onboarding/success`,
                    failure: `${process.env.NEXT_PUBLIC_URL}/admin/onboarding/failure`,
                    pending: `${process.env.NEXT_PUBLIC_URL}/admin/onboarding/pending`
                },
                auto_return: 'approved',
                notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/mercadopago`,
                statement_descriptor: 'HACELOTUYO',
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas
            }
        });

        return NextResponse.json({
            init_point: preference.init_point,
            preference_id: preference.id
        });

    } catch (error) {
        console.error('Error creating payment preference:', error);
        return NextResponse.json(
            { error: 'Error al crear preferencia de pago' },
            { status: 500 }
        );
    }
}
