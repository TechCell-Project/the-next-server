const token = '';

function generateRandomStrings(countOfResults = 1) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let results = [];
    for (let j = 0; j < countOfResults; j++) {
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        result += Date.now().toString().slice(-5); // append the last 5 digits of the current timestamp
        results.push(result);
    }
    return results;
}

async function getSkus() {
    // Increase limit and it but in skus controller
    const response = await fetch('http://localhost:8000/api/skus?limit=1&page=1', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        console.error(JSON.stringify(await response.json()));
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return (await response.json()).data.map((sku) => sku._id.toString());
}

async function sendPostRequests(skuIds, host = `http://localhost:8000`) {
    const requests = skuIds.map((id) => {
        const serials = generateRandomStrings(20);
        return fetch(`${host}/api/skus/${id}/serial-numbers`, {
            method: 'POST',
            body: JSON.stringify({
                serialNumbers: serials,
            }),
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
    });

    const responses = await Promise.all(requests);
    return Promise.all(responses.map((response) => response.text()));
}

async function main() {
    const skus = await getSkus();
    console.log(skus.length);

    const results = await sendPostRequests(skus);
    console.log(results);
}

main();
