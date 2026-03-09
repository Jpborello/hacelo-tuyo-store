import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    console.log('--- Checking products schema ---');
    const { data: products, error } = await supabase
        .from('productos')
        .select('*')
        .limit(1);
        
    if (products && products.length > 0) {
        console.log("Columns:", Object.keys(products[0]));
    } else {
        console.log("Error or no products:", error);
    }
}

check();
