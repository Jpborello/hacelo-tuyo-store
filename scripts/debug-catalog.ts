
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';

async function run() {
    console.log('--- DEBUGGING CATALOG ---');

    // 1. Check Commerce
    const { data: commerce, error: cError } = await supabase
        .from('comercios')
        .select('*')
        .eq('id', COMERCIO_ID)
        .single();

    if (cError) {
        console.error('Error fetching commerce:', cError);
        return;
    }
    console.log('Commerce found:', commerce.nombre, 'Limit:', commerce.limite_productos);

    // 2. Check Products Count
    const { count, error: countError } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('comercio_id', COMERCIO_ID);

    console.log('Current Product Count:', count);

    // 3. Force Insert if < 5
    if (count! < 5) {
        console.log('--- STARTING RE-SEED ---');
        const IMAGES_DIR = path.join(process.cwd(), 'public', 'demo', 'productos');

        // 1. Ensure Categories Exist
        const categories = ['Almacén', 'Kiosco'];
        const categoryIds: Record<string, string> = {};

        for (const catName of categories) {
            const { data: existing } = await supabase
                .from('categorias')
                .select('id')
                .eq('comercio_id', COMERCIO_ID)
                .eq('nombre', catName)
                .single();

            if (existing) {
                categoryIds[catName] = existing.id;
            } else {
                const { data: created } = await supabase
                    .from('categorias')
                    .insert({
                        comercio_id: COMERCIO_ID,
                        nombre: catName,
                        slug: catName.toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/\s+/g, '-'),
                        orden: 1
                    })
                    .select()
                    .single();
                if (created) categoryIds[catName] = created.id;
            }
            console.log(`Category ${catName}: ${categoryIds[catName]}`);
        }

        // 2. Insert Products
        try {
            if (!fs.existsSync(IMAGES_DIR)) {
                console.error('IMAGES_DIR does not exist:', IMAGES_DIR);
                return;
            }
            const files = fs.readdirSync(IMAGES_DIR);
            console.log(`Found ${files.length} files to insert.`);

            for (const file of files) {
                if (file === '.gitkeep') continue;
                // Check if already exists to avoid dupes (optional, but good for debug)
                const name = file.replace(/\.(png|jpg|jpeg)$/i, '').trim();

                // Determine Category
                let categoryId = categoryIds['Kiosco'];
                const lowerName = name.toLowerCase();
                if (lowerName.includes('aceite') || lowerName.includes('arroz')) {
                    categoryId = categoryIds['Almacén'];
                }

                const { error } = await supabase.from('productos').insert({
                    comercio_id: COMERCIO_ID,
                    categoria_id: categoryId,
                    nombre: name,
                    precio: 1500,
                    stock: 100,
                    imagen_url: `/demo/productos/${file}`,
                    activo: true,
                    unidad_medida: 'bulto'
                });

                if (error) console.error(`Failed to insert ${name}:`, error.message);
                else console.log(`Inserted: ${name}`);
            }
        } catch (e) {
            console.error('Error during seeding:', e);
        }
    }

    // 4. List Categories
    const { data: cats } = await supabase.from('categorias').select('*').eq('comercio_id', COMERCIO_ID);
    console.log('Categories:', cats);
}

run();
