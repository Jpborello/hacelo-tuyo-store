
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';

async function test() {
    let output = '--- TEST INSERT START ---\n';

    // 1. Get Categories
    const { data: cats, error: catError } = await supabase
        .from('categorias')
        .select('*')
        .eq('comercio_id', COMERCIO_ID);

    if (catError) {
        output += `Error getting categories: ${JSON.stringify(catError)}\n`;
    } else {
        output += `Categories: ${JSON.stringify(cats, null, 2)}\n`;
    }

    if (!cats || cats.length === 0) {
        output += 'NO CATEGORIES FOUND. Cannot insert product.\n';
        // Try to create one
        const { data: newCat, error: createError } = await supabase.from('categorias').insert({
            comercio_id: COMERCIO_ID,
            nombre: 'Test Cat',
            slug: 'test-cat',
            orden: 1
        }).select().single();

        output += `Created Test Cat: ${JSON.stringify(newCat)} Error: ${JSON.stringify(createError)}\n`;
        if (newCat) cats?.push(newCat);
    }

    if (cats && cats.length > 0) {
        const catId = cats[0].id;
        output += `Using Category ID: ${catId}\n`;

        // 2. Insert Product
        const { data: prod, error: prodError } = await supabase.from('productos').insert({
            comercio_id: COMERCIO_ID,
            categoria_id: catId,
            nombre: 'Producto de Prueba Script',
            precio: 1234,
            stock: 10,
            unidad_medida: 'bulto',
            imagen_url: null
        }).select().single();

        if (prodError) {
            output += `INSERT ERROR: ${JSON.stringify(prodError, null, 2)}\n`;
        } else {
            output += `INSERT SUCCESS: ${JSON.stringify(prod, null, 2)}\n`;
        }
    }

    fs.writeFileSync('test-status.txt', output);
    console.log('Finished. Check test-status.txt');
}

test();
