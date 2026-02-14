require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Datos de productos con sus imágenes locales
const productosData = {
    almacen: [
        { nombre: 'Aceite Girasol 5LT', descripcion: 'Aceite de girasol puro 5 litros', precio: 8500.00, stock: 50, imagen: 'Aceite Girasol 5LT.png', unidad: 'bulto' },
        { nombre: 'Aceite de Oliva Cañuelas Extra Virgen 500ML', descripcion: 'Aceite de oliva extra virgen premium 500ml', precio: 4200.00, stock: 30, imagen: 'Aceite de oliva cañuelas extra virgen 500ML.png', unidad: 'bulto' },
        { nombre: 'Aceite Oliva Extra Virgen', descripcion: 'Aceite de oliva extra virgen', precio: 3800.00, stock: 40, imagen: 'Aceite oliva extra virgen .png', unidad: 'bulto' },
        { nombre: 'Arroz Lucchetti Cheddar', descripcion: 'Arroz sabor cheddar Lucchetti', precio: 1850.00, stock: 100, imagen: 'Arroz Lucchetti Cheddar.png', unidad: 'bulto' },
        { nombre: 'Arroz Marcos', descripcion: 'Arroz blanco Marcos 1kg', precio: 1650.00, stock: 120, imagen: 'Arroz Marcos.png', unidad: 'bulto' },
        { nombre: 'Arroz Gallo Oro 1KG', descripcion: 'Arroz Gallo Oro de primera calidad 1kg', precio: 1750.00, stock: 100, imagen: 'Arroz gallo oro 1KL.png', unidad: 'bulto' },
        { nombre: 'Arroz Preparado Gallo Sabor Queso', descripcion: 'Arroz preparado con sabor a queso', precio: 1900.00, stock: 80, imagen: 'Arroz preparado gallo sabor queso.png', unidad: 'bulto' }
    ],
    chocolates: [
        { nombre: 'Bocaditos Ferrero Rocher', descripcion: 'Chocolates Ferrero Rocher premium', precio: 6500.00, stock: 25, imagen: 'Bocaditos Ferrero Rocher.png', unidad: 'bulto' },
        { nombre: 'Chocolate Barra Mapricuber', descripcion: 'Barra de chocolate Mapricuber', precio: 2100.00, stock: 60, imagen: 'Chocolate Barra Mapricuber.png', unidad: 'bulto' },
        { nombre: 'Chocolate Nestle Classic', descripcion: 'Chocolate Nestle clásico', precio: 2300.00, stock: 70, imagen: 'Chocolate Nestle Clasic.png', unidad: 'bulto' },
        { nombre: 'Chocolate Águila Baño Repostería Celeste', descripcion: 'Chocolate para baño de repostería celeste', precio: 3200.00, stock: 40, imagen: 'Chocolate agila baño reposteria celeste.png', unidad: 'bulto' },
        { nombre: 'Chocolate Águila Baño Repostería Rosa', descripcion: 'Chocolate para baño de repostería rosa', precio: 3200.00, stock: 40, imagen: 'Chocolate aguila baño rep rosa.png', unidad: 'bulto' },
        { nombre: 'Chocolate Águila Baños Repostería', descripcion: 'Chocolate para baño de repostería', precio: 3400.00, stock: 45, imagen: 'Chocolate aguila baños reposteria.png', unidad: 'bulto' },
        { nombre: 'Chocolate con Maní Cofler', descripcion: 'Chocolate con maní Cofler', precio: 1950.00, stock: 80, imagen: 'Chocolate con mani Cofler.png', unidad: 'bulto' },
        { nombre: 'Cofler Block Untable', descripcion: 'Chocolate untable Cofler Block', precio: 2800.00, stock: 50, imagen: 'Cofler Blcok untable.png', unidad: 'bulto' },
        { nombre: 'Águila Notella Avellana', descripcion: 'Crema de avellanas Águila Notella', precio: 3100.00, stock: 55, imagen: 'aguila notella avellane.png', unidad: 'bulto' }
    ],
    golosinas: [
        { nombre: 'Caramelo Líquido', descripcion: 'Caramelo líquido dulce', precio: 1200.00, stock: 90, imagen: 'Caramelo Liquido .png', unidad: 'bulto' },
        { nombre: 'Caramelos FunDipperz', descripcion: 'Caramelos FunDipperz surtidos', precio: 850.00, stock: 150, imagen: 'Caramelos FunDipperz.png', unidad: 'bulto' },
        { nombre: 'Chupetín Push Pop Minions', descripcion: 'Chupetín Push Pop de Minions', precio: 650.00, stock: 200, imagen: 'Chupetin Push Pop Minions.png', unidad: 'granel' },
        { nombre: 'Chupetín Sabor Frutilla', descripcion: 'Chupetín sabor frutilla', precio: 450.00, stock: 250, imagen: 'Chupetin Sabor Frutilla.png', unidad: 'granel' },
        { nombre: 'Chupetín Spring Pop', descripcion: 'Chupetín Spring Pop', precio: 550.00, stock: 220, imagen: 'Chupetin Spring Pop.png', unidad: 'granel' },
        { nombre: 'Goma de Mascar TopLine', descripcion: 'Chicles TopLine', precio: 380.00, stock: 300, imagen: 'Goma de mascar TopLine.png', unidad: 'granel' },
        { nombre: 'Gomitas Frutales FunDipperz', descripcion: 'Gomitas con sabor a frutas', precio: 920.00, stock: 180, imagen: 'Gomitas Frutales FunDipperz.png', unidad: 'bulto' },
        { nombre: 'Mentos Fresa', descripcion: 'Mentos sabor fresa', precio: 420.00, stock: 200, imagen: 'Mentos Fresa.png', unidad: 'granel' },
        { nombre: 'Mentos Menta', descripcion: 'Mentos sabor menta', precio: 420.00, stock: 200, imagen: 'Mentos Menta.png', unidad: 'granel' },
        { nombre: 'Mentos Multi Frutas', descripcion: 'Mentos sabor multi frutas', precio: 420.00, stock: 200, imagen: 'Mentos Multi Frutas.png', unidad: 'granel' },
        { nombre: 'Snack con Chocolate GoDipperz', descripcion: 'Snack con chocolate GoDipperz', precio: 980.00, stock: 160, imagen: 'Snack con chocolate GoDipperz.png', unidad: 'bulto' }
    ]
};

async function setupCompleteDemo() {
    console.log('🚀 Configuración completa automática\n');

    try {
        // 1. Obtener usuario
        console.log('1️⃣ Buscando usuario mayorista-test...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === 'mayorista-test@hacelotuyo.com');

        if (!user) {
            console.log('   ❌ Usuario no encontrado. Creá el usuario primero en http://localhost:3000/register-demo');
            return;
        }
        console.log(`   ✅ Usuario encontrado: ${user.id}`);

        // 2. Obtener o crear comercio
        console.log('\n2️⃣ Verificando comercio...');
        let { data: comercio } = await supabase
            .from('comercios')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!comercio) {
            const { data: newComercio, error } = await supabase
                .from('comercios')
                .insert({
                    user_id: user.id,
                    nombre: 'Mayorista Test',
                    slug: 'mayorista-test'
                })
                .select()
                .single();

            if (error) {
                console.log(`   ⚠️  Error: ${error.message}`);
                return;
            }
            comercio = newComercio;
            console.log(`   ✅ Comercio creado: ${comercio.id}`);
        } else {
            console.log(`   ✅ Comercio existe: ${comercio.id}`);
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

        const categoriaMap = {};
        for (const cat of categorias) {
            const { data, error } = await supabase
                .from('categorias')
                .upsert({
                    comercio_id: comercio.id,
                    ...cat
                }, { onConflict: 'comercio_id,slug' })
                .select()
                .single();

            if (!error && data) {
                categoriaMap[cat.slug] = data.id;
                console.log(`   ✅ ${cat.nombre}: ${data.id}`);
            }
        }

        // 4. Verificar bucket de storage
        console.log('\n4️⃣ Verificando bucket de storage...');
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets.some(b => b.name === 'productos-hacelotuyo');

        if (!bucketExists) {
            console.log('   ⚠️  Bucket no existe. Creándolo...');
            const { error } = await supabase.storage.createBucket('productos-hacelotuyo', {
                public: true
            });
            if (error) {
                console.log(`   ⚠️  Error creando bucket: ${error.message}`);
            } else {
                console.log('   ✅ Bucket creado');
            }
        } else {
            console.log('   ✅ Bucket existe');
        }

        // 5. Subir imágenes y crear productos
        console.log('\n5️⃣ Subiendo imágenes y creando productos...');
        const imageDir = path.join(__dirname, '..', 'public', 'demo', 'productos');

        let totalProductos = 0;
        for (const [categoria, productos] of Object.entries(productosData)) {
            console.log(`\n   📦 Categoría: ${categoria.toUpperCase()}`);

            for (const producto of productos) {
                const imagePath = path.join(imageDir, producto.imagen);

                // Verificar si la imagen existe
                if (!fs.existsSync(imagePath)) {
                    console.log(`   ⚠️  Imagen no encontrada: ${producto.imagen}`);
                    continue;
                }

                // Subir imagen a Storage
                const fileBuffer = fs.readFileSync(imagePath);
                const fileName = `${comercio.id}/${Date.now()}-${producto.imagen}`;

                const { error: uploadError } = await supabase.storage
                    .from('productos-hacelotuyo')
                    .upload(fileName, fileBuffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                let imagenUrl = `/demo/productos/${producto.imagen}`;
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('productos-hacelotuyo')
                        .getPublicUrl(fileName);
                    imagenUrl = publicUrl;
                }

                // Crear producto
                const { error: prodError } = await supabase
                    .from('productos')
                    .insert({
                        comercio_id: comercio.id,
                        categoria_id: categoriaMap[categoria],
                        nombre: producto.nombre,
                        descripcion: producto.descripcion,
                        precio: producto.precio,
                        stock: producto.stock,
                        imagen_url: imagenUrl,
                        unidad_medida: producto.unidad
                    });

                if (prodError) {
                    console.log(`   ⚠️  ${producto.nombre}: ${prodError.message}`);
                } else {
                    console.log(`   ✅ ${producto.nombre}`);
                    totalProductos++;
                }
            }
        }

        console.log(`\n✅ ¡Configuración completa!`);
        console.log(`\n📊 Resumen:`);
        console.log(`   Usuario: mayorista-test@hacelotuyo.com`);
        console.log(`   Comercio: ${comercio.nombre} (${comercio.slug})`);
        console.log(`   Categorías: ${Object.keys(categoriaMap).length}`);
        console.log(`   Productos: ${totalProductos}`);
        console.log(`\n🎯 Probá en: http://localhost:3000/mayorista-test`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

setupCompleteDemo();
