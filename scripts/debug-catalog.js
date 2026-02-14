require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCatalog() {
    console.log('🔍 Debugging catálogo mayorista-test\n');

    // 1. Verificar comercio
    const { data: comercio } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', 'mayorista-test')
        .single();

    if (!comercio) {
        console.log('❌ Comercio no encontrado');
        return;
    }

    console.log(`✅ Comercio encontrado:`);
    console.log(`   ID: ${comercio.id}`);
    console.log(`   Nombre: ${comercio.nombre}`);
    console.log(`   Slug: ${comercio.slug}\n`);

    // 2. Contar productos
    const { count, error } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('comercio_id', comercio.id);

    console.log(`📦 Total productos: ${count || 0}`);
    if (error) {
        console.log(`   Error: ${error.message}\n`);
    }

    // 3. Listar primeros 10 productos
    const { data: productos } = await supabase
        .from('productos')
        .select('id, nombre, precio, categoria_id, imagen_url')
        .eq('comercio_id', comercio.id)
        .limit(10);

    if (productos && productos.length > 0) {
        console.log(`\n✅ Primeros ${productos.length} productos:`);
        productos.forEach((p, i) => {
            console.log(`   ${i + 1}. ${p.nombre} - $${p.precio}`);
            console.log(`      Imagen: ${p.imagen_url}`);
            console.log(`      Categoría ID: ${p.categoria_id}`);
        });
    } else {
        console.log('\n❌ NO HAY PRODUCTOS en la base de datos');
    }

    // 4. Verificar categorías
    const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('comercio_id', comercio.id);

    console.log(`\n📁 Categorías: ${categorias?.length || 0}`);
    if (categorias) {
        categorias.forEach(cat => {
            console.log(`   - ${cat.nombre} (${cat.slug}) - ID: ${cat.id}`);
        });
    }

    console.log(`\n🔗 URL del catálogo: http://localhost:3000/${comercio.slug}`);
}

debugCatalog();
