const { MercadoPagoConfig, User } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

async function verifyCredentials() {
    console.log('--- Verificando Credenciales de Mercado Pago ---');
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
        console.error('❌ ERROR: MP_ACCESS_TOKEN no encontrado en .env.local');
        return;
    }

    console.log(`Token encontrado: ${token.substring(0, 10)}...`);

    const client = new MercadoPagoConfig({ accessToken: token });
    const user = new User(client);

    try {
        console.log('Consultando información del usuario (Vendedor)...');
        // Intentamos obtener info del propio usuario dueño del token
        const userData = await user.get();

        console.log('✅ Credenciales VÁLIDAS');
        console.log(`User ID: ${userData.id}`);
        console.log(`Nickname: ${userData.nickname}`);
        console.log(`Email: ${userData.email}`);
        console.log(`País: ${userData.country_id}`); // Debería ser MLA
        console.log(`Sitio: ${userData.site_id}`);    // Debería ser MLA

        if (userData.country_id !== 'MLA') {
            console.warn('⚠️ ADVERTENCIA: La cuenta del vendedor NO es de Argentina (MLA). Esto causará problemas.');
        } else {
            console.log('👍 País correcto (Argentina).');
        }

    } catch (error) {
        console.error('❌ ERROR al validar credenciales:');
        console.error(error.message);
        if (error.cause) console.error('Causa:', error.cause);
    }
}

verifyCredentials();
