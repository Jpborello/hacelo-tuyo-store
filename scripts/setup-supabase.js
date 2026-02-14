require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Faltan credenciales de Supabase en .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupDatabase() {
    console.log('🚀 Iniciando configuración de Supabase...\n');

    try {
        // 1. Verificar conexión
        console.log('1️⃣ Verificando conexión a Supabase...');
        const { data: testData, error: testError } = await supabase
            .from('comercios')
            .select('count')
            .limit(1);

        if (testError) {
            console.log(`   ⚠️  Error de conexión: ${testError.message}`);
            return;
        }
        console.log('   ✅ Conexión exitosa');

        // 2. Buscar comercio existente
        console.log('\n2️⃣ Buscando comercio existente...');
        const { data: comercios, error: comercioError } = await supabase
            .from('comercios')
            .select('*');

        if (comercioError) {
            console.log(`   ❌ Error: ${comercioError.message}`);
            return;
        }

        if (!comercios || comercios.length === 0) {
            console.log('   ⚠️  No hay comercios.');
            console.log('   📝 Necesitás crear el usuario mayorista-test@hacelotuyo.com en Supabase Dashboard');
            console.log('   � Authentication > Users > Add User');
            return;
        }

        const comercio = comercios[0];
        const comercioId = comercio.id;
        console.log(`   ✅ Comercio encontrado: "${comercio.nombre}" (slug: ${comercio.slug})`);

        // 3. Actualizar slug si es necesario
        if (comercio.slug !== 'mayorista-test') {
            console.log('\n3️⃣ Actualizando slug del comercio...');
            const { error: updateError } = await supabase
                .from('comercios')
                .update({
                    slug: 'mayorista-test',
                    nombre: 'Mayorista Test'
                })
                .eq('id', comercioId);

            if (updateError) {
                console.log(`   ⚠️  Error: ${updateError.message}`);
            } else {
                console.log('   ✅ Slug actualizado a "mayorista-test"');
            }
        } else {
            console.log('\n3️⃣ Slug ya es "mayorista-test" ✅');
        }

        // 4. Verificar si existe tabla categorias
        console.log('\n4️⃣ Verificando tabla categorias...');
        const { data: catTest, error: catTestError } = await supabase
            .from('categorias')
            .select('id')
            .limit(1);

        if (catTestError) {
            console.log(`   ⚠️  Tabla categorias no existe o tiene error: ${catTestError.message}`);
            console.log('   📝 Ejecutá database_migration_categories.sql en Supabase SQL Editor primero');
            return;
        }
        console.log('   ✅ Tabla categorias existe');

        // 5. Crear/actualizar categorías
        console.log('\n5️⃣ Creando categorías...');
        const categorias = [
            { nombre: 'Todos', slug: 'todos', orden: 0 },
            { nombre: 'Almacén', slug: 'almacen', orden: 1 },
            { nombre: 'Chocolates', slug: 'chocolates', orden: 2 },
            { nombre: 'Golosinas', slug: 'golosinas', orden: 3 },
            { nombre: 'Bebidas', slug: 'bebidas', orden: 4 },
        ];

        for (const cat of categorias) {
            const { data, error } = await supabase
                .from('categorias')
                .upsert({
                    comercio_id: comercioId,
                    nombre: cat.nombre,
                    slug: cat.slug,
                    orden: cat.orden
                }, {
                    onConflict: 'comercio_id,slug'
                })
                .select();

            if (error) {
                console.log(`   ⚠️  Error creando "${cat.nombre}": ${error.message}`);
            } else {
                console.log(`   ✅ Categoría "${cat.nombre}" creada/actualizada`);
            }
        }

        // 6. Obtener IDs de categorías
        console.log('\n6️⃣ Obteniendo IDs de categorías...');
        const { data: categoriasCreadas, error: catError } = await supabase
            .from('categorias')
            .select('*')
            .eq('comercio_id', comercioId)
            .order('orden');

        if (catError) {
            console.log(`   ⚠️  Error: ${catError.message}`);
            return;
        }

        console.log('\n📋 IDs de Categorías:');
        const categoriaMap = {};
        categoriasCreadas.forEach(cat => {
            categoriaMap[cat.slug] = cat.id;
            console.log(`   ${cat.nombre}: ${cat.id}`);
        });

        console.log('\n✅ ¡Configuración completada!');
        console.log('\n� Información para insertar productos:');
        console.log(`   Comercio ID: ${comercioId}`);
        console.log(`   Almacén ID: ${categoriaMap['almacen']}`);
        console.log(`   Chocolates ID: ${categoriaMap['chocolates']}`);
        console.log(`   Golosinas ID: ${categoriaMap['golosinas']}`);
        console.log(`   Bebidas ID: ${categoriaMap['bebidas']}`);

        console.log('\n🎯 Próximos pasos:');
        console.log('   1. Copiá los IDs de arriba');
        console.log('   2. Abrí seed_demo_data.sql y reemplazá los IDs');
        console.log('   3. Ejecutá los INSERT de productos en Supabase SQL Editor');
        console.log('   4. Probá en http://localhost:3000/mayorista-test');

    } catch (error) {
        console.error('\n❌ Error inesperado:', error.message);
        console.error(error);
    }
}

setupDatabase();
