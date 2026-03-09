import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Use ANON KEY to simulate an unauthenticated user (incognito window)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testAnonInsert() {
    const comercioId = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';
    
    console.log(`Checking INSERT access for pedidos as anonymous user...`);
    
    // We'll roll back by making it an invalid insert or just inserting a test row and deleting it (anon probably can't delete).
    // Let's just try to insert a fake order.
    
    const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
            comercio_id: comercioId,
            cliente_nombre: 'Test Anon User',
            direccion: 'Test',
            telefono: '123',
            total: 10,
            estado: 'pendiente'
        })
        .select()
        .single();
        
    if (pedidoError) {
        console.error('Error inserting as anonymous:', pedidoError);
    } else {
        console.log('Success inserting order as anonymous! Data:', pedido);
    }
}

testAnonInsert();
