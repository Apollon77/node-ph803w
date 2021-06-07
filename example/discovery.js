const { PH803WDiscovery } = require('../index');

const discovery = new PH803WDiscovery();

discovery.on('error', err => {
    console.log(`ERROR: ${err}`);
});

discovery.on('device', data => {
    console.log(`PH803W Device discovered on ${data.ip}`);
    console.log(JSON.stringify(data));
});

console.log('Discover PH803W devices ... CTRL-C to quit');

discovery.discover();