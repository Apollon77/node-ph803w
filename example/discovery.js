const { PH803WDiscovery } = require('../index');

const discovery = new PH803WDiscovery();

discovery.on('error', err => {
    console.log(`ERROR: ${err}`);
});

discovery.on('device', (data, remote) => {
    console.log(`PH803W Device discovered on ${remote.address}`);
    console.log(JSON.stringify(data));
});

discovery.discover();