import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13'; // Nuevo Rumbo

async function updateActive() {
    console.log('--- Setting all products to active=true ---');
    const { data, error } = await supabase
        .from('productos')
        .update({ activo: true })
        .eq('comercio_id', COMERCIO_ID);
        
    if (error) {
        console.error("Error updating products:", error);
    } else {
        console.log("Success! Products updated.");
    }
}

updateActive();
