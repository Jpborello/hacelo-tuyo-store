const https = require('https');

const options = {
    hostname: 'api.mercadopago.com',
    path: '/users/me',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer TEST-1673751278043716-021418-4ed91e36a3a0109440469d2c1d7c4f01-564942006'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Site ID:', json.site_id);
            console.log('Country ID:', json.country_id);
        } catch (e) {
            console.log('Error parsing JSON:', e);
            console.log(data.substring(0, 200));
        }
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
