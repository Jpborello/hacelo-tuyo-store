require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupComplete() {
    console.log('🚀 Configuración completa del usuario demo...\n');

    try {
        // 1. Confirmar email del usuario
        console.log('1️⃣ Confirmando email del usuario...');
        const { error: confirmError } = await supabase.rpc('exec', {
            sql: `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'mayorista-test@hacelotuyo.com';`
        });

        // Intentar de otra forma si falla
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === 'mayorista-test@hacelotuyo.com');

        if (!user) {
            console.log('   ❌ Usuario no encontrado');
            return;
        }

        console.log(`   ✅ Usuario encontrado: ${user.id}`);

        // 2. Crear comercio
        console.log('\n2️⃣ Creando comercio...');
        const { data: comercio, error: comercioError } = await supabase
            .from('comercios')
            .upsert({
                user_id: user.id,
                nombre: 'Mayorista Test',
                slug: 'mayorista-test'
            }, {
                onConflict: 'slug'
            })
            .select()
            .single();

        if (comercioError) {
            console.log(`   ⚠️  Error: ${comercioError.message}`);

            // Intentar obtener el comercio existente
            const { data: existingComercio } = await supabase
                .from('comercios')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (existingComercio) {
                console.log(`   ✅ Comercio ya existe: ${existingComercio.id}`);
                comercio = existingComercio;
            } else {
                return;
            }
        } else {
            console.log(`   ✅ Comercio creado: ${comercio.id}`);
        }

        // 3. Crear categorías
        console.log('\n3️⃣ Creando categorías...');
        const categorias = [
            { nombre: 'Todos', slug: 'todos', orden: 0 },
            { nombre: 'Almacén', slug: 'almacen', orden: 1 },
            { nombre: 'Chocolates', slug: 'chocolates', orden: 2 },
            { nombre: 'Golosinas', slug: 'golosinas', orden: 3 },
            { nombre: 'Bebidas', slug: 'bebidas', orden: 4 },
        ];

        for (const cat of categorias) {
            const { error } = await supabase
                .from('categorias')
                .upsert({
                    comercio_id: comercio.id,
                    ...cat
                }, {
                    onConflict: 'comercio_id,slug'
                });

            if (error) {
                console.log(`   ⚠️  Error en "${cat.nombre}": ${error.message}`);
            } else {
                console.log(`   ✅ Categoría "${cat.nombre}" creada`);
            }
        }

        // 4. Mostrar IDs para productos
        console.log('\n4️⃣ Obteniendo IDs de categorías...');
        const { data: categoriasCreadas } = await supabase
            .from('categorias')
            .select('*')
            .eq('comercio_id', comercio.id)
            .order('orden');

        console.log('\n📋 IDs para insertar productos:');
        console.log(`   Comercio ID: ${comercio.id}`);
        categoriasCreadas.forEach(cat => {
            console.log(`   ${cat.nombre}: ${cat.id}`);
        });

        console.log('\n✅ ¡Todo listo!');
        console.log('\n🎯 Próximos pasos:');
        console.log('   1. Copiá los IDs de arriba');
        console.log('   2. Abrí fix_user_creation.sql');
        console.log('   3. Reemplazá los IDs en los INSERT de productos');
        console.log('   4. Ejecutá los INSERT en Supabase SQL Editor');
        console.log('   5. Probá el login en http://localhost:3000/login');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

setupComplete();
