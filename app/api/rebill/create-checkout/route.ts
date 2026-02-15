export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const REBILL_PLAN_IDS = {
    micro: 'test_pln_3eac036eb4444f97af02c185125e9272', // 'test' en snippet usuario maps a micro
    basico: 'test_pln_18d8385e9ece496195fda410591a706e',
    estandar: 'test_pln_c66b5d8d935d4df08e07c937d65fc20e',
    premium: 'test_pln_83d43559788c40e6ad223c334ea89527'
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

        // Mapeo 'test' a 'micro' si viene del front, o uso directo
        const targetPlan = planId === 'micro' ? 'test_pln_3eac036eb4444f97af02c185125e9272' : REBILL_PLAN_IDS[planId as keyof typeof REBILL_PLAN_IDS];

        if (!targetPlan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

        console.log(`Creating Rebill Checkout for Commerce: ${comercio.id}, Plan: ${planId} (${targetPlan})`);

        // Llamada a Rebill para generar el Checkout
        const response = await fetch('https://api.rebill.com/v2/checkout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.REBILL_SECRET_KEY}`, // Usamos SECRET KEY
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                planId: targetPlan,
                startDate: new Date().toISOString(),
                // Metadata para identificar al comercio cuando el pago pegue
                metadata: {
                    comercio_id: comercio.id,
                    user_email: user.email
                },
                // Redirecciones post-pago
                redirection: {
                    success: "https://hacelotuyo.com.ar/admin/dashboard?session=success",
                    error: "https://hacelotuyo.com.ar/admin/dashboard?session=error"
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Rebill API Error Response:', data);
            throw new Error(data.message || 'Error creating Rebill session');
        }

        // Rebill devuelve el 'url' para redirigir al usuario
        // El frontend espera { init_point: url } para mantener compatibilidad con la lógica existente
        return NextResponse.json({ init_point: data.url });

    } catch (error: any) {
        console.error('REBILL CHECKOUT ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
