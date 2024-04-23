/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

// Get the token from the command line
const token = process.argv[2];

// var hostName = `http://localhost:8000`;
var hostName = `https://api.techcell.cloud`;
let requestCount = 0;

async function createSpu(spu, host = hostName) {
    const response = await fetch(`${host}/api/spus`, {
        method: 'POST',
        body: JSON.stringify(spu),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        console.error(await response.json());
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    requestCount++;
    return await response.json();
}

async function createSkus(skus, spuId, host = hostName) {
    const requests = skus.map((sku) => {
        sku.spuId = spuId?.toString() ?? sku.spuId;
        return fetch(`${host}/api/skus`, {
            method: 'POST',
            body: JSON.stringify(sku),
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        })
            .then((response) => ({ response, sku }))
            .catch((error) => ({ error, sku }));
    });

    const responses = await Promise.all(requests);
    return Promise.all(
        responses.map(async ({ response, sku }, index) => {
            if (response.status >= 200 && response.status < 299) {
                console.log(`Request ${index + 1}: success`);
                requestCount++;
                return 'success';
            } else {
                const errorData = await response.json();
                console.log(
                    `Request ${index + 1}: failed with status ${response.status}, error: ${JSON.stringify(errorData)}, data: ${JSON.stringify({ name: sku.name, attributes: sku.attributes })}`,
                );
                requestCount++;
                return errorData;
            }
        }),
    );
}

async function main(filePath) {
    try {
        fs.readFile(filePath, 'utf8', async (err, data) => {
            if (err) {
                console.error(`Error reading file from disk: ${err}`);
            } else {
                const product = JSON.parse(data);
                const spu = product.spu;
                const skus = product.skus;

                const res = await createSpu(spu);
                console.log(res._id);

                const spuId = res._id;
                await createSkus(skus, spuId);

                console.log(`Total request count: ${requestCount}`);
            }
        });
    } catch (error) {
        console.error(error);
    }
}

fs.readdir('./data/samples', (err, files) => {
    if (err) {
        console.error('Could not list the directory.', err);
        process.exit(1);
    }

    files.forEach((file) => {
        const filePath = path.join('./data/samples', file);
        main(filePath);
    });
});
