import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13'; // Nuevo Rumbo

async function check() {
    console.log('--- Checking active products ---');
    const { data: products, error } = await supabase
        .from('productos')
        .select('*')
        .eq('comercio_id', COMERCIO_ID);
        
    if (error) {
        console.error("Error fetching products:", error);
        return;
    }
    
    if (!products) {
        console.log("No products array returned.");
        return;
    }
    
    const active = products.filter(p => p.activo === true);
    const inactive = products.filter(p => p.activo === false);
    const nullActive = products.filter(p => p.activo === null || p.activo === undefined);
    
    console.log(`Total: ${products.length}`);
    console.log(`Active (true): ${active.length}`);
    console.log(`Inactive (false): ${inactive.length}`);
    console.log(`Null or Undefined active: ${nullActive.length}`);
    
    if (active.length === 0 && products.length > 0) {
        console.log("\nSample product (to see why it's not active):", products[0]);
    }
}

check();
