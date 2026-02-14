const https = require('https');

const data = JSON.stringify({
    site_id: 'MLA',
    description: 'Comprador de Prueba Hacelo Tuyo'
});

const options = {
    hostname: 'api.mercadopago.com',
    path: '/users/test_user',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TEST-1673751278043716-021418-4ed91e36a3a0109440469d2c1d7c4f01-564942006',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    res.on('end', () => {
        console.log('Test User Created:', responseData);
        try {
            const json = JSON.parse(responseData);
            console.log('EMAIL:', json.email);
            console.log('PASSWORD:', json.password);
        } catch (e) {
            console.log('Error parsing JSON:', e);
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(data);
req.end();
