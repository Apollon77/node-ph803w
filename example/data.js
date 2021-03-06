/**
 * Example script to get Data from a PH803W device
 *
 * Usage: node data.js <IP address>
 *
 * To see debug output call like: DEBUG=ph803w* node data.js <IP address>
 */

const { PH803WDevice } = require('../index');

async function main() {
    const device = new PH803WDevice(process.argv[2]);

    device.on('error', err => {
        console.log('Error: ' + err);
    });

    device.on('data', data => {
        console.log('Data: ' + JSON.stringify(data));
    });

    device.on('connected', async () => {
        await device.login();
        await device.retrieveData();
    });

    await device.connect();
}

if (process.argv.length !== 3) {
    console.log('Usage: node data.js 111.222.333.444');
    process.exit();
}

main();
