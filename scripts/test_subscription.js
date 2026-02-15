const { MercadoPagoConfig, PreApproval } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

async function testSubscription() {
    console.log('--- Iniciando Prueba de Suscripción Local ---');

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ ERROR: Falta MP_ACCESS_TOKEN en .env.local');
        return;
    }

    console.log(`Usando Token: ${token.substring(0, 10)}...`);

    const client = new MercadoPagoConfig({ accessToken: token });
    const preapproval = new PreApproval(client);

    const subscriptionData = {
        reason: 'Plan Prueba Local',
        external_reference: 'TEST_LOCAL_REF',
        payer_email: 'test_user_2520602603@testuser.com', // El mismo que hardcodeamos
        auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 50000,
            currency_id: 'ARS'
        },
        back_url: 'https://hacelo-tuyo-store-olhw.vercel.app/admin/dashboard',
        status: 'pending'
    };

    console.log('Enviando datos a Mercado Pago:', subscriptionData);

    try {
        const response = await preapproval.create({ body: subscriptionData });
        console.log('✅ ¡ÉXITO! Suscripción creada.');
        console.log('Init Point:', response.init_point);
        console.log('ID:', response.id);
    } catch (error) {
        console.error('❌ ERROR al crear suscripción:');
        console.error('Mensaje:', error.message);

        if (error.cause) {
            console.error('Causa:', JSON.stringify(error.cause, null, 2));
        }
        if (error.response) {
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Status:', error.response.status);
        }
    }
}

testSubscription();
