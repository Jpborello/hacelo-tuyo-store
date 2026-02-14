require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateProductImages() {
    console.log('🖼️  Actualizando imágenes de productos...\n');

    const { data: comercio } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', 'mayorista-test')
        .single();

    if (!comercio) {
        console.log('❌ Comercio no encontrado');
        return;
    }

    // Mapeo de productos a imágenes
    const imageMap = {
        'Aceite Girasol 5LT': 'Aceite Girasol 5LT.png',
        'Arroz Marcos': 'Arroz Marcos.png',
        'Chocolate Ferrero Rocher': 'Bocaditos Ferrero Rocher.png',
        'Chocolate Nestle': 'Chocolate Nestle Clasic.png',
        'Caramelo Líquido': 'Caramelo Liquido .png',
        'Mentos Menta': 'Mentos Menta.png'
    };

    let actualizados = 0;
    for (const [nombre, imagen] of Object.entries(imageMap)) {
        const { error } = await supabase
            .from('productos')
            .update({ imagen_url: `/demo/productos/${imagen}` })
            .eq('comercio_id', comercio.id)
            .eq('nombre', nombre);

        if (error) {
            console.log(`❌ ${nombre}: ${error.message}`);
        } else {
            console.log(`✅ ${nombre} → ${imagen}`);
            actualizados++;
        }
    }

    console.log(`\n✅ Imágenes actualizadas: ${actualizados}/${Object.keys(imageMap).length}`);
    console.log(`\n🔗 Refrescá: http://localhost:3000/mayorista-test`);
}

updateProductImages();
