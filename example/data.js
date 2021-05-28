const { PH803WDevice } = require('../index');

async function main() {
    const device = new PH803WDevice(process.argv[2]);
    device.on('error', err => {
        console.log('Error: ' + err);
    });
    device.on('data', data => {
        console.log('Data: ' + JSON.stringify(data));
    });

    await device.connect();

    await device.login();

    await device.retrieveData();
}

if (process.argv.length !== 3) {
    console.log('Usage: node data.js 111.222.333.444');
    process.exit();
}

main();
