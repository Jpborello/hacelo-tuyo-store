import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUserEmail() {
    const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';

    const { data: comercio } = await supabase
        .from('comercios')
        .select('user_id')
        .eq('id', COMERCIO_ID)
        .single();

    if (comercio) {
        // auth.users is protected, need to use admin api
        const { data: { user }, error } = await supabase.auth.admin.getUserById(comercio.user_id);
        if (user) {
            console.log('User email is:', user.email);
        } else {
            console.log('Error getting user:', error);
        }
    }
}

checkUserEmail();
