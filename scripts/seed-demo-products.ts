
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const COMERCIO_ID = 'e6fd214c-c5bd-4768-bfb3-880ec4b2dd13';
const IMAGES_DIR = path.join(process.cwd(), 'public', 'demo', 'productos');

async function seed() {
    console.log(`Starting seed for commerce: ${COMERCIO_ID}`);

    // 1. Ensure Categories Exist
    const categories = ['Almacén', 'Kiosco'];
    const categoryIds: Record<string, string> = {};

    for (const catName of categories) {
        // Check if exists
        const { data: existing } = await supabase
            .from('categorias')
            .select('id')
            .eq('comercio_id', COMERCIO_ID)
            .eq('nombre', catName)
            .single();

        if (existing) {
            categoryIds[catName] = existing.id;
            console.log(`Category exists: ${catName} (${existing.id})`);
        } else {
            // Create
            const { data: created, error } = await supabase
                .from('categorias')
                .insert({
                    comercio_id: COMERCIO_ID,
                    nombre: catName,
                    slug: catName.toLowerCase().replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i').replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/\s+/g, '-'),
                    orden: 1
                })
                .select()
                .single();

            if (error || !created) {
                console.error(`Error creating category ${catName}:`, error);
                process.exit(1);
            }
            categoryIds[catName] = created.id;
            console.log(`Category created: ${catName} (${created.id})`);
        }
    }

    // 2. Read Files and Insert Products
    try {
        const files = fs.readdirSync(IMAGES_DIR);
        console.log(`Found ${files.length} files in ${IMAGES_DIR}`);

        for (const file of files) {
            if (file === '.gitkeep') continue;

            const name = file.replace(/\.(png|jpg|jpeg)$/i, '').trim();
            const imageUrl = `/demo/productos/${file}`;

            // Determine Category
            let categoryId = categoryIds['Kiosco'];
            const lowerName = name.toLowerCase();
            if (lowerName.includes('aceite') || lowerName.includes('arroz')) {
                categoryId = categoryIds['Almacén'];
            }

            console.log(`Processing: ${name} -> ${categoryId === categoryIds['Almacén'] ? 'Almacén' : 'Kiosco'}`);

            // Insert Product
            const { error } = await supabase
                .from('productos')
                .insert({
                    comercio_id: COMERCIO_ID,
                    categoria_id: categoryId,
                    nombre: name,
                    precio: 1500, // Precio demo
                    stock: 100,
                    imagen_url: imageUrl,
                    unidad_medida: 'bulto'
                });

            if (error) {
                console.error(`Error inserting ${name}:`, error);
            } else {
                console.log(`Inserted: ${name}`);
            }
        }

        console.log('Seed completed successfully!');

    } catch (e) {
        console.error('Error reading directory:', e);
    }
}

seed();
