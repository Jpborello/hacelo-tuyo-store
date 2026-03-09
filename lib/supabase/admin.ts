import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase SOLO PARA SERVIDOR
// Utiliza la llave SERVICE_ROLE para saltarse el Row Level Security (RLS)
// ¡CUIDADO! Nunca usar en componentes del cliente.

export function createAdminClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Faltan variables de entorno para el cliente admin de Supabase');
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}
