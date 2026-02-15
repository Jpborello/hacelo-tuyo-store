const { MercadoPagoConfig, Payment } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

const PAYMENT_ID = '145659067801';

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

async function checkPayer() {
    try {
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: PAYMENT_ID });

        console.log('--- Datos del Pagador ---');
        console.log('Email:', paymentData.payer.email);
        console.log('ID:', paymentData.payer.id);

        // Ver si hay algo más en metadata
        console.log('Metadata:', JSON.stringify(paymentData.metadata, null, 2));
        console.log('External Ref:', paymentData.external_reference);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkPayer();
