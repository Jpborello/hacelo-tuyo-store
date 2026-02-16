'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Create a Supabase client with the SERVICE ROLE KEY to bypass RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdmin() {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
        throw new Error('Unauthorized');
    }
    return user;
}

export async function getAllComercios() {
    await checkAdmin();

    const { data, error } = await supabaseAdmin
        .from('comercios')
        .select('*')
        .order('creado_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
}

export async function updateComercioPlan(id: string, plan: string, limite: number) {
    await checkAdmin();

    const { error } = await supabaseAdmin
        .from('comercios')
        .update({ plan, limite_productos: limite })
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function updateComercioStatus(id: string, status: string) {
    await checkAdmin();

    const { error } = await supabaseAdmin
        .from('comercios')
        .update({ estado: status })
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}
