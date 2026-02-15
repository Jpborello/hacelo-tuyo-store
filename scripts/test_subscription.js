const { MercadoPagoConfig, PreApproval } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

async function testSubscription() {
    console.log('--- Iniciando Prueba de Suscripción Local (CON PLAN) ---');

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ ERROR: Falta MP_ACCESS_TOKEN en .env.local');
        return;
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preapproval = new PreApproval(client);

    // ID del Plan Básico generado recientemente
    const PLAN_ID_BASICO = 'fe2bdde38c084335ab9e5fc87bf8b0fc';

    const subscriptionData = {
        // preapproval_plan_id: PLAN_ID_BASICO,
        reason: 'Plan Básico (Test Sin Plan)',
        payer_email: 'test_user_2520602603@testuser.com',
        back_url: 'https://hacelo-tuyo-store-olhw.vercel.app/admin/dashboard',
        auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 50000,
            currency_id: 'ARS'
        },
        status: 'pending',
        external_reference: 'TEST_REF_NO_PLAN'
    };

    console.log('Enviando datos a Mercado Pago:', subscriptionData);

    try {
        const response = await preapproval.create({ body: subscriptionData });
        console.log('✅ ¡ÉXITO! Suscripción creada con PLAN.');
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
