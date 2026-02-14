import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BackofficeClient from './BackofficeClient';

export default async function BackofficePage() {
    const supabase = await createServerSupabaseClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // TODO: Agregar chequeo de admin real (por email o rol)
    // Por ahora, solo restringimos el acceso visualmente o por URL

    return <BackofficeClient />;
}
