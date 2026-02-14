require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifySetup() {
    console.log('🔍 Verificando configuración...\n');

    // Verificar comercio
    const { data: comercio } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', 'mayorista-test')
        .single();

    if (!comercio) {
        console.log('❌ Comercio no encontrado');
        return;
    }

    console.log(`✅ Comercio: ${comercio.nombre}`);
    console.log(`   ID: ${comercio.id}`);
    console.log(`   Slug: ${comercio.slug}\n`);

    // Verificar categorías
    const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('comercio_id', comercio.id)
        .order('orden');

    console.log(`✅ Categorías: ${categorias.length}`);
    categorias.forEach(cat => {
        console.log(`   - ${cat.nombre} (${cat.slug})`);
    });

    // Verificar productos
    const { data: productos } = await supabase
        .from('productos')
        .select('*, categorias(nombre)')
        .eq('comercio_id', comercio.id);

    console.log(`\n✅ Productos: ${productos.length}`);

    // Agrupar por categoría
    const porCategoria = {};
    productos.forEach(p => {
        const catNombre = p.categorias?.nombre || 'Sin categoría';
        if (!porCategoria[catNombre]) porCategoria[catNombre] = [];
        porCategoria[catNombre].push(p.nombre);
    });

    Object.entries(porCategoria).forEach(([cat, prods]) => {
        console.log(`\n   📦 ${cat} (${prods.length} productos):`);
        prods.forEach(p => console.log(`      - ${p}`));
    });

    console.log(`\n\n🎯 Todo listo! Probá en: http://localhost:3000/mayorista-test`);
}

verifySetup();
