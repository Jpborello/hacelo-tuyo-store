const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function wipe() {
    console.log('========== WIPPING DATABASE ==========');

    try {
        // 1. Clean public tables first (to handle constraints manually if needed, or orphan records)
        console.log('Cleaning public.productos...');
        const { error: prodErr } = await supabase
            .from('productos')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (prodErr) console.error('Error cleaning products:', prodErr);
        else console.log('✅ Products table cleared.');

        console.log('Cleaning public.comercios...');
        const { error: comErr } = await supabase
            .from('comercios')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (comErr) console.error('Error cleaning comercios:', comErr);
        else console.log('✅ Comercios table cleared.');

        // 2. Clean auth.users
        console.log('Fetching users to delete...');
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Error listing users: ${listError.message}`);
        }

        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`Deleting user: ${user.email} (${user.id})...`);
            const { error: delError } = await supabase.auth.admin.deleteUser(user.id);

            if (delError) {
                console.error(`❌ Failed to delete user ${user.id}:`, delError);
            } else {
                console.log(`✅ Deleted user ${user.email}`);
            }
        }

        console.log('========== WIPE COMPLETE ==========');
        console.log('The database is clean. You can register new users now.');

    } catch (err) {
        console.error('CRITICAL ERROR DURING WIPE:', err);
    }
}

wipe();
