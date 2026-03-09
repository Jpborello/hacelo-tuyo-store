import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function enable() {
    const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';

    // Set proximo_pago to way in the future
    const { data: updatedCommerce, error } = await supabase
        .from('comercios')
        .update({
            estado: 'activo',
            mp_status: 'active',
            proximo_pago: '2099-01-01',
            tiene_metodo_pago: true
        })
        .eq('id', COMERCIO_ID)
        .select()
        .single();

    if (error) {
        console.error('Error updating commerce:', error);
    } else {
        console.log('Successfully updated commerce Nuevo Rumbo (andres@test):');
        console.log(updatedCommerce);
    }
}

enable();
