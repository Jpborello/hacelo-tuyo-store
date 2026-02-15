const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

async function createMicroPlan() {
    console.log('--- Creando Plan Micro (10 ARS) para Prod ---');

    // IMPORTANTE: Asegurarse de que .env.local tenga el token de PRODUCCIÓN antes de correr esto
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ ERROR: Falta MP_ACCESS_TOKEN');
        return;
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preapprovalPlan = new PreApprovalPlan(client);

    const backUrl = 'https://hacelotuyo.com.ar/admin/dashboard';

    const microPlan = {
        reason: 'Plan Micro Prueba (20 ARS)',
        auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: 20,
            currency_id: 'ARS'
        },
        back_url: backUrl,
        external_reference: 'MICRO_PLAN_TEST'
    };

    try {
        console.log(`Creando plan: ${microPlan.reason}...`);
        const response = await preapprovalPlan.create({ body: microPlan });
        console.log(`✅ Plan creado con éxito!`);
        console.log(`ID del Plan: ${response.id}`);
        console.log(`Init Point: ${response.init_point}`);

        // Guardar en archivo para fácil acceso
        const fs = require('fs');
        const planData = {
            id: response.id,
            init_point: response.init_point,
            reason: microPlan.reason
        };
        fs.writeFileSync('scripts/micro_plan.json', JSON.stringify(planData, null, 2));
        console.log('Datos guardados en scripts/micro_plan.json');

    } catch (error) {
        console.error(`❌ Error creando plan:`, error.message);
        if (error.response) {
            console.error(JSON.stringify(error.response.data, null, 2));
        }
    }
}

createMicroPlan();
