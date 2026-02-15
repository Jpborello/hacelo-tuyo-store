const { MercadoPagoConfig, Payment } = require('mercadopago');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración
const PAYMENT_ID = '145659067801'; // ID de la captura del usuario

const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixSubscription() {
    console.log(`🔍 Consultando Pago ID: ${PAYMENT_ID}...`);

    try {
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: PAYMENT_ID });

        console.log('✅ Pago encontrado!');
        console.log(`Estado: ${paymentData.status}`);
        console.log(`Monto: ${paymentData.transaction_amount}`);
        console.log(`External Reference (Comercio ID): ${paymentData.external_reference}`);

        if (!paymentData.external_reference) {
            console.error('❌ El pago no tiene external_reference. No puedo vincularlo.');
            return;
        }

        const comercioId = paymentData.external_reference;
        const amount = paymentData.transaction_amount;

        // Determinar Plan
        let nuevoPlan = null;
        let limite = 20;

        if (amount === 20) {
            nuevoPlan = 'micro';
            limite = 5;
        } else if (amount === 50000) {
            nuevoPlan = 'basico';
            limite = 50;
        } else if (amount === 70000) {
            nuevoPlan = 'estandar';
            limite = 100; // Asumiendo estándar
        } else if (amount === 80000) {
            nuevoPlan = 'premium';
            limite = 100;
        }

        if (!nuevoPlan) {
            console.error('❌ Monto no reconocido para ningún plan.');
            return;
        }

        console.log(`🛠 Actualizando Comercio ${comercioId} a Plan ${nuevoPlan}...`);

        const { error } = await supabase
            .from('comercios')
            .update({
                mp_status: 'authorized', // Asumimos autorizado porque pagó
                plan: nuevoPlan,
                limite_productos: limite,
                mp_subscription_id: 'MANUAL_FIX_FROM_PAYMENT_' + PAYMENT_ID
            })
            .eq('id', comercioId);

        if (error) {
            console.error('❌ Error actualizando Supabase:', error);
        } else {
            console.log('🚀 ¡ÉXITO! Comercio actualizado correctamente.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

fixSubscription();
