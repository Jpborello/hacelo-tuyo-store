import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Verify request is from Vercel Cron
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = await createServerSupabaseClient();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all active accounts
        const { data: comercios, error } = await supabase
            .from('comercios')
            .select('*')
            .eq('estado', 'activo');

        if (error) throw error;

        const blocked: string[] = [];

        for (const comercio of comercios || []) {
            const proximoPago = new Date(comercio.proximo_pago);
            proximoPago.setHours(0, 0, 0, 0);

            let shouldBlock = false;

            // Check if trial expired (no grace period)
            if (comercio.meses_sin_pagar === 0) {
                // Trial user - block immediately after expiration
                if (proximoPago < today) {
                    shouldBlock = true;
                }
            } else {
                // Paying customer - 5 days grace period
                const gracePeriodEnd = new Date(proximoPago);
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 5);

                if (gracePeriodEnd < today) {
                    shouldBlock = true;
                }
            }

            if (shouldBlock) {
                // Block account
                const { error: updateError } = await supabase
                    .from('comercios')
                    .update({ estado: 'suspendido' })
                    .eq('id', comercio.id);

                if (!updateError) {
                    blocked.push(comercio.nombre);
                }
            }
        }

        return NextResponse.json({
            success: true,
            checked: comercios?.length || 0,
            blocked: blocked.length,
            accounts: blocked,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('Error checking subscriptions:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Allow manual execution for testing
export async function POST(request: NextRequest) {
    return GET(request);
}
