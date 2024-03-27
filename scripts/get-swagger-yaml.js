/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http');
const fs = require('fs');

const options = {
    hostname: 'localhost',
    port: process.env.API_PORT || 8000,
    path: '/docs-yaml',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        fs.writeFileSync('swagger.yaml', data, 'utf8');
        console.log('Swagger YAML file has been saved!');
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
