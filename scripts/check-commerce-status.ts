
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';

async function check() {
    let output = '--- Checking Commerce ---\n';

    // List all to verify
    const { data: all } = await supabase.from('comercios').select('id, nombre, slug');
    output += `All Comercios in DB: ${JSON.stringify(all, null, 2)}\n`;

    const { data: commerce } = await supabase
        .from('comercios')
        .select('*')
        .eq('id', COMERCIO_ID)
        .single();

    output += `Commerce: ${JSON.stringify(commerce, null, 2)}\n`;

    output += '\n--- Checking Products ---\n';
    const { count } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('comercio_id', COMERCIO_ID);

    output += `Total Products in DB: ${count}\n`;

    const { data: products } = await supabase
        .from('productos')
        .select('id, nombre, activo, categoria_id')
        .eq('comercio_id', COMERCIO_ID)
        .limit(5);

    output += `Sample Products: ${JSON.stringify(products, null, 2)}\n`;

    fs.writeFileSync('status.txt', output);
    console.log('Written to status.txt');
}

check();
