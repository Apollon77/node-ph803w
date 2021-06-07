/*jshint expr: true*/
const chai = require('chai');
const expect = chai.expect;
const TestServer = require('./lib/testServer');
const PH803WDevice = require('../lib/device');
const PH803WDiscovery = require('../lib/discovery');

describe('PH803-W Test', function() {
    let testServer;

    before('init server', async () => {
        testServer = new TestServer();
        await testServer.open();
    });

    it('parse discovery message #1', done => {
        const discovery = new PH803WDiscovery();

        discovery.on('error', err => {
            // todo
        });

        discovery.on('device', data => {
            expect(data.id).to.equal('CFqpJTSymCE9PLlp1DpbhY');
            expect(data.data3).to.equal('2d3d954d9bb741b4a19ba1153104932b');
            expect(data.apiServer).to.equal('api.gizwits.com:80');
            expect(data.version).to.equal('4.0.8');
            expect(data.ip).to.equal('127.0.0.1');
            done();
        });

        const data = Buffer.from('00000003680000040016434671704a5453796d434539504c6c703144706268590006483fda87dc4700000020326433643935346439626237343162346131396261313135333130343933326200000000000000026170692e67697a776974732e636f6d3a383000342e302e3800', 'hex');
        discovery.parseResponse(data, {address: '127.0.0.1'});
    });

    it('parse discovery message #2', done => {
        const discovery = new PH803WDiscovery();

        discovery.on('error', err => {
            // todo
        });

        discovery.on('device', data => {
            expect(data.id).to.equal('2tqRa88FgaUS5AxgARVYug');
            expect(data.data3).to.equal('2d3d954d9bb741b4a19ba1153104932b');
            expect(data.apiServer).to.equal('api.gizwits.com:80');
            expect(data.version).to.equal('4.1.2');
            expect(data.ip).to.equal('127.0.0.2');
            done();
        });

        const data = Buffer.from('00000003780000040016327471526138384667615553354178674152565975670006e8db848c4b17000830343032303033410020326433643935346439626237343162346131396261313135333130343933326200000000000000026170692e67697a776974732e636f6d3a383000342e312e32003033303330303030', 'hex');
        discovery.parseResponse(data, {address: '127.0.0.2'});
    });

    it('connect and disconnect', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        await device.close(false);
    });

    it('connect and login with passcode negotiation', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        await device.login();

        await device.close(false);
    });

    it('connect and login with provided passcode', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        await device.login('IPQRSTUVWX');

        await device.close(false);
    });

    it('connect and failed login', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let errored = true;
        try {
            await device.login('IPQRSTUVWY');
            errored = false;
        } catch (err) {
            expect(err.message).to.equal('Login rejected by device, check the passcode');
        }
        expect(errored).to.be.true;

        await device.close(false);
    });

    it('connect, login and check ping/pong', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        await device.login();

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                expect(testServer.lastPingTime).to.be.not.null;
                const lastPing = testServer.lastPingTime;
                setTimeout(async () => {
                    expect(testServer.lastPingTime).to.be.not.equal(lastPing);
                    await device.close(false);
                    resolve();
                }, 4000);
            }, 5000);
        });
    }).timeout(10000);

    it('connect, login and retrieve data', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        await device.login();

        let eventReceived = false;
        let eventCounter = 0;
        device.on('data', data => {
            expect(data).to.exist;
            if (!eventCounter) {
                expect(data.ph).to.equal(7.32);
                expect(data.redox).to.equal(205);
                expect(data.phSwitch).to.be.true;
                expect(data.redoxSwitch).to.be.true;
            }
            eventReceived = true;
            eventCounter++;
        });
        const data = await device.retrieveData();

        expect(data).to.exist;
        expect(data.ph).to.equal(7.32);
        expect(data.redox).to.equal(205);
        expect(data.phSwitch).to.be.true;
        expect(data.redoxSwitch).to.be.true;

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                expect(eventReceived).to.be.true;
                expect(eventCounter).to.be.at.least(5);
                await device.close(false);
                resolve();
            }, 30000);
        });
    }).timeout(35000);

    after('shutdown server', async () => {
        await testServer.close();
    });

});
