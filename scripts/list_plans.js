const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function listPlans() {
    console.log('--- Listando Planes a JSON ---');
    const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const preapprovalPlan = new PreApprovalPlan(client);

    try {
        const response = await preapprovalPlan.search({
            options: { limit: 10, offset: 0, status: 'active' }
        });

        let results = response.results || response.paging?.results || [];

        // Si results es un objeto con propiedad results
        if (results.results) results = results.results;

        console.log(`Encontrados: ${results.length}`);

        fs.writeFileSync('scripts/plans_list.json', JSON.stringify(results, null, 2));
        console.log('Planes guardados en scripts/plans_list.json');

    } catch (error) {
        console.error('❌ Error listando planes:', error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    }
}

listPlans();
