require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function forceCreateProducts() {
    console.log('💪 Creando productos FORZADO...\n');

    // 1. Obtener IDs necesarios
    const { data: comercio } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', 'mayorista-test')
        .single();

    if (!comercio) {
        console.log('❌ Comercio no encontrado');
        return;
    }

    const { data: categorias } = await supabase
        .from('categorias')
        .select('*')
        .eq('comercio_id', comercio.id);

    const catMap = {};
    categorias.forEach(cat => {
        catMap[cat.slug] = cat.id;
    });

    console.log(`Comercio ID: ${comercio.id}`);
    console.log(`Almacén ID: ${catMap['almacen']}`);
    console.log(`Chocolates ID: ${catMap['chocolates']}`);
    console.log(`Golosinas ID: ${catMap['golosinas']}\n`);

    // 2. Productos simples para probar
    const productosTest = [
        { nombre: 'Aceite Girasol 5LT', cat: 'almacen', precio: 8500, stock: 50 },
        { nombre: 'Arroz Marcos', cat: 'almacen', precio: 1650, stock: 120 },
        { nombre: 'Chocolate Ferrero Rocher', cat: 'chocolates', precio: 6500, stock: 25 },
        { nombre: 'Chocolate Nestle', cat: 'chocolates', precio: 2300, stock: 70 },
        { nombre: 'Caramelo Líquido', cat: 'golosinas', precio: 1200, stock: 90 },
        { nombre: 'Mentos Menta', cat: 'golosinas', precio: 420, stock: 200 }
    ];

    let creados = 0;
    for (const prod of productosTest) {
        try {
            const { data, error } = await supabase
                .from('productos')
                .insert({
                    comercio_id: comercio.id,
                    categoria_id: catMap[prod.cat],
                    nombre: prod.nombre,
                    descripcion: `Producto demo: ${prod.nombre}`,
                    precio: prod.precio,
                    stock: prod.stock,
                    imagen_url: '/demo/productos/placeholder.png',
                    unidad_medida: 'bulto'
                })
                .select();

            if (error) {
                console.log(`❌ ${prod.nombre}:`);
                console.log(`   Error: ${error.message}`);
                console.log(`   Code: ${error.code}`);
                console.log(`   Details: ${JSON.stringify(error.details)}`);
            } else {
                console.log(`✅ ${prod.nombre} creado (ID: ${data[0].id})`);
                creados++;
            }
        } catch (err) {
            console.log(`❌ ${prod.nombre}: ${err.message}`);
        }
    }

    console.log(`\n✅ Total creados: ${creados}/${productosTest.length}`);

    // Verificar
    const { count } = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true })
        .eq('comercio_id', comercio.id);

    console.log(`📦 Productos en DB: ${count}`);
    console.log(`\n🔗 Probá: http://localhost:3000/mayorista-test`);
}

forceCreateProducts();
