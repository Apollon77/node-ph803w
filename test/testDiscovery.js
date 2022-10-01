/*jshint expr: true*/
const chai = require('chai');
const expect = chai.expect;
const TestServer = require('./lib/testUdpServer');
const PH803WDiscovery = require('../lib/discovery');

describe('PH803-W Discovery Test', function() {
    let testServer;

    before('init server', async () => {
        testServer = new TestServer();
        await testServer.open();
    });

    /*
     * If you have a firewall, you may need to allow responses with:
     *   sudo ufw allow proto udp to 0.0.0.0/0 port 12414
     */
    it('test udp discovery', done => {
        const discovery = new PH803WDiscovery();

        discovery.on('error', err => console.log(`ERROR: ${err}`));

        new Promise(resolve => {
            discovery.on('device', resolve);
        }).then(async data => {
            expect(data.id).to.equal('CFqpJTSymCE9PLlp1DpbhY');
            expect(data.data3).to.equal('2d3d954d9bb741b4a19ba1153104932b');
            expect(data.apiServer).to.equal('api.gizwits.com:80');
            expect(data.version).to.equal('4.0.8');
            await discovery.stop();
            done();
        }).catch(done);

        discovery.discover();
    });

    it('parse discovery message #1', done => {
        const discovery = new PH803WDiscovery();

        discovery.on('error', err => console.log(`ERROR: ${err}`));

        discovery.on('device', data => {
            expect(data.id).to.equal('CFqpJTSymCE9PLlp1DpbhY');
            expect(data.data3).to.equal('2d3d954d9bb741b4a19ba1153104932b');
            expect(data.apiServer).to.equal('api.gizwits.com:80');
            expect(data.version).to.equal('4.0.8');
            expect(data.ip).to.equal('127.0.0.1');
            done();
        });

        const data = Buffer.from('00000003680000040016434671704a5453796d434539504c6c703144706268590006483fda87dc4700000020326433643935346439626237343162346131396261313135333130343933326200000000000000026170692e67697a776974732e636f6d3a383000342e302e3800', 'hex');
        discovery._parseResponse(data, {address: '127.0.0.1'});
    });

    it('parse discovery message #2', done => {
        const discovery = new PH803WDiscovery();

        discovery.on('error', err => console.log(`ERROR: ${err}`));

        discovery.on('device', data => {
            expect(data.id).to.equal('2tqRa88FgaUS5AxgARVYug');
            expect(data.data3).to.equal('2d3d954d9bb741b4a19ba1153104932b');
            expect(data.apiServer).to.equal('api.gizwits.com:80');
            expect(data.version).to.equal('4.1.2');
            expect(data.ip).to.equal('127.0.0.2');
            done();
        });

        const data = Buffer.from('00000003780000040016327471526138384667615553354178674152565975670006e8db848c4b17000830343032303033410020326433643935346439626237343162346131396261313135333130343933326200000000000000026170692e67697a776974732e636f6d3a383000342e312e32003033303330303030', 'hex');
        discovery._parseResponse(data, {address: '127.0.0.2'});
    });

    after('shutdown server', async () => {
        await testServer.close();
    });

});
