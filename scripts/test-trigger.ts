import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testTrigger() {
    const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';
    let output = {};

    // 1. Check current status
    let { data: c1 } = await supabase.from('comercios').select('estado, mp_status').eq('id', COMERCIO_ID).single();
    output.before = c1;

    // 2. Get a product
    let { data: products } = await supabase.from('productos').select('id, precio').eq('comercio_id', COMERCIO_ID).limit(1);
    const prod = products[0];
    output.product = prod;

    // 3. Update product price
    const { error: err } = await supabase.from('productos').update({ precio: prod.precio + 1 }).eq('id', prod.id);
    if (err) output.updateError = err;

    // 4. Wait 2 seconds
    await new Promise(r => setTimeout(r, 2000));

    // 5. Check status again
    let { data: c2 } = await supabase.from('comercios').select('estado, mp_status').eq('id', COMERCIO_ID).single();
    output.after = c2;

    fs.writeFileSync('trigger-test-result.json', JSON.stringify(output, null, 2));
}

testTrigger();
