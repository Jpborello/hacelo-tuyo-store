const { MercadoPagoConfig, PreApproval } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

async function testAdHoc() {
    console.log('--- Probando Creación de Suscripción Ad-Hoc ---');

    try {
        const preapproval = new PreApproval(client);

        const subscriptionData = {
            payer_email: 'nerogamerr136@gmail.com',
            external_reference: 'REF_TEST_123',
            back_url: 'https://hacelotuyo.com.ar/admin/dashboard',
            reason: 'Suscripción Micro (Prueba) - Hacelo Tuyo',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 20,
                currency_id: 'ARS'
            },
            status: 'pending'
        };

        console.log('Sending data:', JSON.stringify(subscriptionData, null, 2));

        const result = await preapproval.create({ body: subscriptionData });

        console.log('✅ Éxito!');
        console.log('Init Point:', result.init_point);
        console.log('ID:', result.id);

    } catch (error) {
        console.error('❌ Error de MP:');
        console.log(JSON.stringify(error, null, 2));

        if (error.cause) {
            console.log('Causa:', error.cause);
        }
    }
}

testAdHoc();
