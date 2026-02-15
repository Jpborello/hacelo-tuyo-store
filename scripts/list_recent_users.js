const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listRecentUsers() {
    console.log('--- Listando usuarios recientes ---');

    // Auth users no se pueden ordenar facilmente por created_at con listUsers directo sin query rpc o sort client side
    // Fetch ultimo 50
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 50
    });

    if (error) {
        console.error(error);
        return;
    }

    // Ordenar en memoria
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    users.slice(0, 10).forEach(u => {
        console.log(`[${u.created_at}] ID: ${u.id} | Email: ${u.email}`);
    });
}

listRecentUsers();
