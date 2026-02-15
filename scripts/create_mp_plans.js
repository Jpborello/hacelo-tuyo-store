const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });

async function createPlans() {
    console.log('--- Creando Planes de Suscripción en Mercado Pago ---');

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
        console.error('❌ ERROR: Falta MP_ACCESS_TOKEN');
        return;
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preapprovalPlan = new PreApprovalPlan(client);

    const backUrl = 'https://hacelo-tuyo-store-olhw.vercel.app/admin/dashboard';

    const planes = [
        {
            reason: 'Plan Básico (Hacelo Tuyo)',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 50000,
                currency_id: 'ARS'
            },
            back_url: backUrl
        },
        {
            reason: 'Plan Estándar (Hacelo Tuyo)',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 70000,
                currency_id: 'ARS'
            },
            back_url: backUrl
        },
        {
            reason: 'Plan Premium (Hacelo Tuyo)',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 80000,
                currency_id: 'ARS'
            },
            back_url: backUrl
        }
    ];

    const fs = require('fs');
    const plansOutput = {};

    for (const plan of planes) {
        try {
            console.log(`Creando plan: ${plan.reason}...`);
            const response = await preapprovalPlan.create({ body: plan });
            console.log(`✅ Plan creado con éxito! ID: ${response.id}`);

            // Guardar ID mapeado por nombre simple
            if (plan.reason.includes('Básico')) plansOutput.basico = response.id;
            if (plan.reason.includes('Estándar')) plansOutput.estandar = response.id;
            if (plan.reason.includes('Premium')) plansOutput.premium = response.id;

        } catch (error) {
            console.error(`❌ Error creando plan ${plan.reason}:`, error.message);
        }
    }

    fs.writeFileSync('scripts/plans.json', JSON.stringify(plansOutput, null, 2));
    console.log('Planes guardados en scripts/plans.json');
}

createPlans();
