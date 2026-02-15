const https = require('https');

const SK = 'sk_0f72f183fd5347a284cadc200f1feb14';
const PLAN_ID = 'test_pln_3eac036eb4444f97af02c185125e9272'; // Micro Test Plan

const options = {
    hostname: 'api.rebill.com',
    path: '/v2/checkout',
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${SK}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

console.log('Testing Checkout Creation...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Plan:', PLAN_ID);

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
        console.log('BODY:', data);
    });
});

req.write(JSON.stringify({
    plan_id: PLAN_ID, // Trying snake_case
    redirection: {
        success: "https://example.com/success",
        error: "https://example.com/error"
    }
}));

req.on('error', (e) => console.error(e));
req.end();
