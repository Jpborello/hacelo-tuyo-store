const https = require('https');

const SK = 'sk_0f72f183fd5347a284cadc200f1feb14';
const PK = 'pk_764ef853ab054efda1c03d890447f7e4';

const domains = ['api.rebill.com', 'api.rebill.to'];
const headersList = [
    { 'Authorization': `Bearer ${SK}`, name: 'Bearer SK' },
    { 'API-Key': SK, name: 'API-Key SK' },
    { 'x-api-key': SK, name: 'x-api-key SK' },
    { 'Authorization': `Bearer ${PK}`, name: 'Bearer PK' },
    { 'Authorization': `Basic ${Buffer.from(SK + ':').toString('base64')}`, name: 'Basic Auth SK' }
];

async function test(domain, headerConfig) {
    return new Promise((resolve) => {
        const { name, ...headers } = headerConfig;
        const options = {
            hostname: domain,
            path: '/v2/organization',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                resolve({
                    domain,
                    auth: name,
                    status: res.statusCode
                    // data: data.substring(0, 100) // Log first 100 chars
                });
            });
        });

        req.on('error', (e) => resolve({ domain, auth: name, error: e.message }));
        req.end();
    });
}

(async () => {
    console.log('Starting exhaustive auth test...');
    for (const d of domains) {
        for (const h of headersList) {
            const res = await test(d, h);
            console.log(JSON.stringify(res));
            if (res.status === 200) {
                console.log('!!! SUCCESS FOUND !!!');
                console.log(`Domain: ${res.domain}`);
                console.log(`Auth: ${res.auth}`);
                process.exit(0);
            }
        }
    }
    console.log('All failed.');
})();
