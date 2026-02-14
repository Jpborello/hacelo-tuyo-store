require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatus() {
    console.log('🔍 Verificando estado actual...\n');

    // 1. Verificar comercio
    const { data: comercio, error: comercioError } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', 'mayorista-test')
        .single();

    if (comercioError || !comercio) {
        console.log('❌ Comercio no encontrado');
        console.log('Error:', comercioError?.message);
        return;
    }

    console.log(`✅ Comercio: ${comercio.nombre} (ID: ${comercio.id})\n`);

    // 2. Verificar categorías
    const { data: categorias, error: catError } = await supabase
        .from('categorias')
        .select('*')
        .eq('comercio_id', comercio.id);

    console.log(`📁 Categorías: ${categorias?.length || 0}`);
    if (categorias) {
        categorias.forEach(cat => console.log(`   - ${cat.nombre} (ID: ${cat.id})`));
    }
    if (catError) {
        console.log('Error:', catError.message);
    }

    // 3. Verificar productos
    const { data: productos, error: prodError } = await supabase
        .from('productos')
        .select('*')
        .eq('comercio_id', comercio.id);

    console.log(`\n📦 Productos: ${productos?.length || 0}`);
    if (prodError) {
        console.log('Error:', prodError.message);
    }

    if (!productos || productos.length === 0) {
        console.log('\n⚠️  NO HAY PRODUCTOS. Necesitamos crearlos.');
        console.log('\nEjecutá: node scripts/create-products-only.js');
    } else {
        console.log('\nPrimeros 5 productos:');
        productos.slice(0, 5).forEach(p => {
            console.log(`   - ${p.nombre} ($${p.precio})`);
        });
    }
}

checkStatus();
