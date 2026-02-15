const https = require('https');

const SK = 'sk_0f72f183fd5347a284cadc200f1feb14';
const PK = 'pk_764ef853ab054efda1c03d890447f7e4';

const options = {
    hostname: 'api.rebill.to', // Trying .to
    path: '/v2/checkouts', // Guessing endpoint
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-api-key': SK,
        'Accept': 'application/json'
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        console.log('BODY:', data);
    });
});

req.write(JSON.stringify({
    total: 100,
    currency: 'ARS',
    description: 'Test Checkout'
}));

req.on('error', (e) => console.error(e));
req.end();
