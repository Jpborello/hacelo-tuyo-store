import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BackofficeClient from './BackofficeClient';

export default async function BackofficePage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Seguridad: Solo permitir el email del administrador
    if (user.email !== process.env.ADMIN_EMAIL) {
        redirect('/admin/dashboard');
    }

    return <BackofficeClient />;
}
