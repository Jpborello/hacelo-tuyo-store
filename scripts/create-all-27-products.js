require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// TODOS los 27 productos con sus imágenes
const productosCompletos = {
    almacen: [
        { nombre: 'Aceite Girasol 5LT', descripcion: 'Aceite de girasol puro 5 litros', precio: 8500.00, stock: 50, imagen: 'Aceite Girasol 5LT.png' },
        { nombre: 'Aceite de Oliva Cañuelas Extra Virgen 500ML', descripcion: 'Aceite de oliva extra virgen premium 500ml', precio: 4200.00, stock: 30, imagen: 'Aceite de oliva cañuelas extra virgen 500ML.png' },
        { nombre: 'Aceite Oliva Extra Virgen', descripcion: 'Aceite de oliva extra virgen', precio: 3800.00, stock: 40, imagen: 'Aceite oliva extra virgen .png' },
        { nombre: 'Arroz Lucchetti Cheddar', descripcion: 'Arroz sabor cheddar Lucchetti', precio: 1850.00, stock: 100, imagen: 'Arroz Lucchetti Cheddar.png' },
        { nombre: 'Arroz Marcos', descripcion: 'Arroz blanco Marcos 1kg', precio: 1650.00, stock: 120, imagen: 'Arroz Marcos.png' },
        { nombre: 'Arroz Gallo Oro 1KG', descripcion: 'Arroz Gallo Oro de primera calidad 1kg', precio: 1750.00, stock: 100, imagen: 'Arroz gallo oro 1KL.png' },
        { nombre: 'Arroz Preparado Gallo Sabor Queso', descripcion: 'Arroz preparado con sabor a queso', precio: 1900.00, stock: 80, imagen: 'Arroz preparado gallo sabor queso.png' }
    ],
    chocolates: [
        { nombre: 'Bocaditos Ferrero Rocher', descripcion: 'Chocolates Ferrero Rocher premium', precio: 6500.00, stock: 25, imagen: 'Bocaditos Ferrero Rocher.png' },
        { nombre: 'Chocolate Barra Mapricuber', descripcion: 'Barra de chocolate Mapricuber', precio: 2100.00, stock: 60, imagen: 'Chocolate Barra Mapricuber.png' },
        { nombre: 'Chocolate Nestle Classic', descripcion: 'Chocolate Nestle clásico', precio: 2300.00, stock: 70, imagen: 'Chocolate Nestle Clasic.png' },
        { nombre: 'Chocolate Águila Baño Repostería Celeste', descripcion: 'Chocolate para baño de repostería celeste', precio: 3200.00, stock: 40, imagen: 'Chocolate agila baño reposteria celeste.png' },
        { nombre: 'Chocolate Águila Baño Repostería Rosa', descripcion: 'Chocolate para baño de repostería rosa', precio: 3200.00, stock: 40, imagen: 'Chocolate aguila baño rep rosa.png' },
        { nombre: 'Chocolate Águila Baños Repostería', descripcion: 'Chocolate para baño de repostería', precio: 3400.00, stock: 45, imagen: 'Chocolate aguila baños reposteria.png' },
        { nombre: 'Chocolate con Maní Cofler', descripcion: 'Chocolate con maní Cofler', precio: 1950.00, stock: 80, imagen: 'Chocolate con mani Cofler.png' },
        { nombre: 'Cofler Block Untable', descripcion: 'Chocolate untable Cofler Block', precio: 2800.00, stock: 50, imagen: 'Cofler Blcok untable.png' },
        { nombre: 'Águila Notella Avellana', descripcion: 'Crema de avellanas Águila Notella', precio: 3100.00, stock: 55, imagen: 'aguila notella avellane.png' }
    ],
    golosinas: [
        { nombre: 'Caramelo Líquido', descripcion: 'Caramelo líquido dulce', precio: 1200.00, stock: 90, imagen: 'Caramelo Liquido .png' },
        { nombre: 'Caramelos FunDipperz', descripcion: 'Caramelos FunDipperz surtidos', precio: 850.00, stock: 150, imagen: 'Caramelos FunDipperz.png' },
        { nombre: 'Chupetín Push Pop Minions', descripcion: 'Chupetín Push Pop de Minions', precio: 650.00, stock: 200, imagen: 'Chupetin Push Pop Minions.png' },
        { nombre: 'Chupetín Sabor Frutilla', descripcion: 'Chupetín sabor frutilla', precio: 450.00, stock: 250, imagen: 'Chupetin Sabor Frutilla.png' },
        { nombre: 'Chupetín Spring Pop', descripcion: 'Chupetín Spring Pop', precio: 550.00, stock: 220, imagen: 'Chupetin Spring Pop.png' },
        { nombre: 'Goma de Mascar TopLine', descripcion: 'Chicles TopLine', precio: 380.00, stock: 300, imagen: 'Goma de mascar TopLine.png' },
        { nombre: 'Gomitas Frutales FunDipperz', descripcion: 'Gomitas con sabor a frutas', precio: 920.00, stock: 180, imagen: 'Gomitas Frutales FunDipperz.png' },
        { nombre: 'Mentos Fresa', descripcion: 'Mentos sabor fresa', precio: 420.00, stock: 200, imagen: 'Mentos Fresa.png' },
        { nombre: 'Mentos Menta', descripcion: 'Mentos sabor menta', precio: 420.00, stock: 200, imagen: 'Mentos Menta.png' },
        { nombre: 'Mentos Multi Frutas', descripcion: 'Mentos sabor multi frutas', precio: 420.00, stock: 200, imagen: 'Mentos Multi Frutas.png' },
        { nombre: 'Snack con Chocolate GoDipperz', descripcion: 'Snack con chocolate GoDipperz', precio: 980.00, stock: 160, imagen: 'Snack con chocolate GoDipperz.png' }
    ]
};

async function createAll27Products() {
    console.log('📦 Creando los 27 productos completos...\n');

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

    // Primero eliminar los 6 productos de prueba
    console.log('🗑️  Eliminando productos de prueba...');
    await supabase
        .from('productos')
        .delete()
        .eq('comercio_id', comercio.id);

    console.log('✅ Productos de prueba eliminados\n');

    let total = 0;
    let errores = 0;

    for (const [catSlug, productos] of Object.entries(productosCompletos)) {
        console.log(`📁 ${catSlug.toUpperCase()}:`);

        for (const prod of productos) {
            const { error } = await supabase
                .from('productos')
                .insert({
                    comercio_id: comercio.id,
                    categoria_id: catMap[catSlug],
                    nombre: prod.nombre,
                    descripcion: prod.descripcion,
                    precio: prod.precio,
                    stock: prod.stock,
                    imagen_url: `/demo/productos/${prod.imagen}`,
                    unidad_medida: 'bulto'
                });

            if (error) {
                console.log(`   ❌ ${prod.nombre}: ${error.message}`);
                errores++;
            } else {
                console.log(`   ✅ ${prod.nombre}`);
                total++;
            }
        }
        console.log('');
    }

    console.log(`✅ Productos creados: ${total}/27`);
    if (errores > 0) {
        console.log(`⚠️  Errores: ${errores}`);
    }
    console.log(`\n🎯 Refrescá: http://localhost:3000/mayorista-test`);
}

createAll27Products();
