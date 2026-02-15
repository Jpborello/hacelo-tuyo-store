const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const USER_EMAIL = 'nerogamerr136@gmail.com';

// Usar Service Role Key para acceder a auth.admin
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

async function fixByEmail() {
    console.log(`🔍 Buscando usuario con email: ${USER_EMAIL}...`);

    // 1. Buscar usuario en Auth
    // Nota: listUsers es paginado, pero asumimos que lo encontraremos o usamos filtro si es posible?
    // Supabase JS no tiene searchUsers por email directo en admin api facil, 
    // pero podemos usar 'getUserById' si tuvieramos ID.
    // Usaremos listUsers y filtraremos (no escalable pero sirve ahora).

    // Mejor intento: no hay search por email en admin?
    // Sí, hay, pero a veces es confuso.

    // Probemos recuperar una pagina y filtrar.
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (authError) {
        console.error('❌ Error listando usuarios:', authError);
        return;
    }

    const user = users.find(u => u.email === USER_EMAIL);

    if (!user) {
        console.error('❌ Usuario no encontrado en la lista (revisar paginación si hay muchos).');
        return;
    }

    console.log(`✅ Usuario encontrado! ID: ${user.id}`);

    // 2. Buscar Comercio
    const { data: comercio, error: dbError } = await supabase
        .from('comercios')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (dbError || !comercio) {
        console.error('❌ Comercio no encontrado para este usuario.', dbError);
        return;
    }

    console.log(`🏠 Comercio encontrado: ${comercio.id} (Plan actual: ${comercio.plan})`);

    // 3. Actualizar
    console.log('🛠 Actualizando a Plan Micro...');

    const { error: updateError } = await supabase
        .from('comercios')
        .update({
            mp_status: 'authorized',
            plan: 'micro',
            limite_productos: 5,
            mp_subscription_id: 'MANUAL_FIX_EMAIL_' + Date.now()
        })
        .eq('id', comercio.id);

    if (updateError) {
        console.error('❌ Error actualizando:', updateError);
    } else {
        console.log('🚀 ¡LISTO! Plan actualizado.');
    }
}

fixByEmail();
