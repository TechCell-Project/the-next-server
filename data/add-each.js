// eslint-disable-next-line @typescript-eslint/no-var-requires
const product = require('./samples/ip-14.json');

const spu = product.spu;
const skus = product.skus;

async function createSpu(spu, host = `http://localhost:8000`) {
    const response = await fetch(`${host}/api/spus`, {
        method: 'POST',
        body: JSON.stringify(spu),
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        console.error(JSON.stringify(await response.json()));
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function sendPostRequests(skus, spuId, host = `http://localhost:8000`) {
    const requests = skus.map((sku) => {
        sku.spuId = spuId?.toString() ?? sku.spuId;
        return fetch(`${host}/api/skus`, {
            method: 'POST',
            body: JSON.stringify(sku),
            headers: { 'Content-Type': 'application/json' },
        }).then((response) => ({ response, sku }));
    });

    const responses = await Promise.all(requests);
    return Promise.all(
        responses.map(async ({ response, sku }, index) => {
            if (response.status >= 200 && response.status < 299) {
                console.log(`Request ${index + 1}: success`);
                return 'success';
            } else {
                const errorData = await response.json();
                console.log(
                    `Request ${index + 1}: failed with status ${response.status}, error: ${JSON.stringify(errorData)}, data: ${JSON.stringify({ name: sku.name, attributes: sku.attributes })}`,
                );
                return errorData;
            }
        }),
    );
}

async function main() {
    try {
        const res = await createSpu(spu);
        console.log(res._id);

        const spuId = res._id;
        // const spuId = `66215d549d1067891146968a`;
        await sendPostRequests(skus, spuId);
    } catch (error) {
        console.error(error);
    }
}

main();
