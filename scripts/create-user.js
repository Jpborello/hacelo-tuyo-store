require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Faltan credenciales');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createDemoUser() {
    console.log('👤 Creando usuario demo...\n');

    try {
        // Crear usuario con Admin API
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'mayorista-test@hacelotuyo.com',
            password: 'Test123456!',
            email_confirm: true,
            user_metadata: {
                name: 'Mayorista Test'
            }
        });

        if (error) {
            if (error.message.includes('already registered')) {
                console.log('✅ Usuario ya existe: mayorista-test@hacelotuyo.com');
                console.log('   Continuando con la configuración...\n');
                return true;
            }
            console.error(`❌ Error: ${error.message}`);
            return false;
        }

        console.log('✅ Usuario creado exitosamente!');
        console.log(`   Email: mayorista-test@hacelotuyo.com`);
        console.log(`   User ID: ${data.user.id}\n`);

        // Esperar un poco para que el trigger se ejecute
        console.log('⏳ Esperando a que se cree el comercio automáticamente...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        return true;
    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
        return false;
    }
}

createDemoUser().then(success => {
    if (success) {
        console.log('\n🎯 Siguiente paso: ejecutá node scripts/setup-supabase.js');
    }
    process.exit(success ? 0 : 1);
});
