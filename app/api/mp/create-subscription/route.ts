export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Precios de Planes (Mensual)
const PLANS_INFO = {
    micro: { price: 20, title: 'Plan Micro (Test)' },
    basico: { price: 50000, title: 'Plan Básico' },
    estandar: { price: 70000, title: 'Plan Estándar' },
    premium: { price: 80000, title: 'Plan Premium' }
};

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: comercio } = await supabase
            .from('comercios')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!comercio) return NextResponse.json({ error: 'Comercio not found' }, { status: 404 });

        const body = await req.json();
        const { planId } = body;

        const planInfo = PLANS_INFO[planId as keyof typeof PLANS_INFO];

        if (!planInfo) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        // Inicializar SDK
        // Usamos production explicitamente
        const client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN!,
            options: { timeout: 5000 }
        });
        const preference = new Preference(client);

        console.log(`Creating Preference for Commerce: ${comercio.id}, Plan: ${planId}, Price: ${planInfo.price}`);

        // Crear Preferencia de Pago Único (Checkout Pro)
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: planId,
                        title: `${planInfo.title} - 30 Días`,
                        description: `Acceso al ${planInfo.title} por 30 días`,
                        quantity: 1,
                        unit_price: planInfo.price,
                        currency_id: 'ARS'
                    }
                ],
                payer: {
                    email: user.email
                },
                back_urls: {
                    success: 'https://hacelotuyo.com.ar/admin/dashboard',
                    failure: 'https://hacelotuyo.com.ar/admin/dashboard',
                    pending: 'https://hacelotuyo.com.ar/admin/dashboard'
                },
                auto_return: 'approved',
                external_reference: comercio.id, // VINCULACIÓN CLAVE
                statement_descriptor: 'HACELOTUYO',
                metadata: {
                    plan_id: planId,
                    user_id: user.id
                }
            }
        });

        if (!result.init_point) {
            throw new Error('No init_point in response');
        }

        return NextResponse.json({ init_point: result.init_point });

    } catch (error: any) {
        console.error('MP PREFERENCE ERROR:', error);
        return NextResponse.json({ error: error.message || 'Error creating preference' }, { status: 500 });
    }
}
