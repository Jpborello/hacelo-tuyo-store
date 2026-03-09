import { createAdminClient } from '../lib/supabase/admin';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkProducts() {
    const supabase = createAdminClient();
    const slug = 'nuevo-rumbo';
    
    // Get store
    const { data: comercio } = await supabase
        .from('comercios')
        .select('*')
        .eq('slug', slug)
        .single();
        
    if (!comercio) {
        console.log("Comercio no encontrado");
        return;
    }
    
    console.log("Comercio:", comercio.nombre, "ID:", comercio.id);
    
    // Get ALL products
    const { data: allProducts } = await supabase
        .from('productos')
        .select('id, nombre, activo, categoria_id')
        .eq('comercio_id', comercio.id);
        
    console.log(`\nTodos los productos (${allProducts?.length || 0}):`, allProducts);
    
    // Get ACTIVE products
    const { data: activeProducts } = await supabase
        .from('productos')
        .select('id, nombre, activo')
        .eq('comercio_id', comercio.id)
        .eq('activo', true);
        
    console.log(`\nProductos activos (${activeProducts?.length || 0}):`, activeProducts);
    
    // Get categories
    const { data: cats } = await supabase
        .from('categorias')
        .select('id, nombre')
        .eq('comercio_id', comercio.id);
        
    console.log(`\nCategorias (${cats?.length || 0}):`, cats);
}

checkProducts();
