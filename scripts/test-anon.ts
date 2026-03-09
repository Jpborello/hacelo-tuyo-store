import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use ANON KEY to simulate an unauthenticated user (incognito window)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testAnonAccess() {
    const slug = 'nuevo-rumbo';
    
    console.log(`Checking access for slug: ${slug} as anonymous user`);
    const { data: comercio, error: comercioError } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', slug)
        .single();
        
    if (comercioError) {
        console.error('Error fetching as anonymous:', comercioError);
    } else {
        console.log('Success fetching as anonymous! Data:', comercio);
    }
}

testAnonAccess();
