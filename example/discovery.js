/**
 * Example script to discover PH803W devices in your network via UDP packets
 *
 * Usage: node discovery.js
 *
 * To see debug output call like: DEBUG=ph803w* node discovery.js
 */

const { PH803WDiscovery } = require('../index');

const discovery = new PH803WDiscovery();

discovery.on('error', err => {
    console.log(`ERROR: ${err}`);
});

discovery.on('device', data => {
    console.log(`PH803W Device discovered on ${data.ip}`);
    console.log(JSON.stringify(data));
});

console.log('Discovering PH803W devices ... CTRL-C to quit');

discovery.discover();