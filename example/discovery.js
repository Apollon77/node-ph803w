/**
 * Example script to discover PH803W devices in your network via UDP packets
 *
 * Usage: node discovery.js
 *
 * To see debug output call like: DEBUG=ph803w* node discovery.js
 *
 * If you have a firewall, you may need to allow responses with:
 *   sudo ufw allow proto udp from 0.0.0.0/0 port 12414
 */

const { PH803WDiscovery } = require('../index');

const discovery = new PH803WDiscovery();

discovery.on('error', err => {
    console.log(`ERROR: ${err}`);
});

discovery.on('device', data => {
    console.log(`PH803W Device ${data.id} discovered on ${data.ip}`);
    console.log(JSON.stringify(data));
});

console.log('Discovering PH803W devices ... CTRL-C to quit');

discovery.discover();