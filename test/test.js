/*jshint expr: true*/
const chai = require('chai');
const expect = chai.expect;
const TestServer = require('./lib/testServer');
const PH803WDevice = require('../lib/device');

describe('PH803-W Test', function() {
    let testServer;

    before('init server', async () => {
        testServer = new TestServer();
        await testServer.open();
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
