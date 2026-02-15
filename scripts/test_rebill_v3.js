const https = require('https');

const SK = 'sk_0f72f183fd5347a284cadc200f1feb14';
const PK = 'pk_764ef853ab054efda1c03d890447f7e4';

const domains = ['api.rebill.com', 'api.rebill.to'];
const headersList = [
    { 'Authorization': `Bearer ${SK}`, name: 'Bearer SK' },
    { 'API-Key': SK, name: 'API-Key SK' },
    { 'x-api-key': SK, name: 'x-api-key SK' },
    { 'Authorization': `Bearer ${PK}`, name: 'Bearer PK' }
];

async function test(domain, headerConfig) {
    return new Promise((resolve) => {
        const { name, ...headers } = headerConfig;
        const options = {
            hostname: domain,
            path: '/v3/organization', // V3
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
                    status: res.statusCode,
                    path: '/v3/organization'
                });
            });
        });

        req.on('error', (e) => resolve({ domain, auth: name, error: e.message }));
        req.end();
    });
}

(async () => {
    console.log('Starting V3 auth test...');
    for (const d of domains) {
        for (const h of headersList) {
            const res = await test(d, h);
            console.log(JSON.stringify(res));
            if (res.status === 200) {
                console.log('!!! SUCCESS FOUND !!!');
                process.exit(0);
            }
        }
    }
    console.log('All failed.');
})();
