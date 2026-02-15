const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

async function getPlan() {
    console.log('--- Obteniendo Detalle del Plan ---');

    const token = process.env.MP_ACCESS_TOKEN;
    const client = new MercadoPagoConfig({ accessToken: token });
    const preapprovalPlan = new PreApprovalPlan(client);

    // ID del Plan Básico (sacado de plans.json o del chat anterior)
    const PLAN_ID = 'fe2bdde38c084335ab9e5fc87bf8b0fc';

    try {
        const response = await preapprovalPlan.get({ id: PLAN_ID });
        console.log('✅ Plan Obtenido:');
        console.log('ID:', response.id);
        console.log('Init Point:', response.init_point);
        console.log('Status:', response.status);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getPlan();
