/*jshint expr: true*/
const chai = require('chai');
const expect = chai.expect;
const { setTimeout: setTimeoutPromise } = require('node:timers/promises');
const TestServer = require('./lib/testServer');
const PH803WDevice = require('../lib/device');

describe('PH803-W Device Test', function() {
    let testServer;

    before('init server', async () => {
        testServer = new TestServer();
        await testServer.open();
    });

    it('connect and disconnect incl events', done => {
        const device = new PH803WDevice('127.0.0.1');

        device.on('connected', () => {
            device.close(false);
        });

        device.on('disconnected', () => {
            done();
        });

        device.connect();
    });

    it('connect and reconnect', done => {
        const device = new PH803WDevice({
            ip: '127.0.0.1',
            reconnectDelay: 1000
        });

        let connectCnt = 0;
        let disconnectCnt = 0;
        let closed = false;

        device.on('error', err => console.log(`ERROR: ${err}`));

        device.on('connected', async () => {
            connectCnt++;
            if (connectCnt === 1) {
                await testServer.close();
                await testServer.open();
            } else if (connectCnt === 2) {
                closed = true;
                await device.close(false);
            }
        });

        device.on('disconnected', () => {
            disconnectCnt++;
            expect(disconnectCnt).to.equal(connectCnt);
            if (closed) {
                done();
            }
        });

        device.connect();
    }).timeout(3000);

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
                expect(data.phOutlet).to.be.true;
                expect(data.redoxOutlet).to.be.true;
            }
            eventReceived = true;
            eventCounter++;
        });
        const data = await device.retrieveData();

        expect(data).to.exist;
        expect(data.ph).to.equal(7.32);
        expect(data.redox).to.equal(205);
        expect(data.phOutlet).to.be.true;
        expect(data.redoxOutlet).to.be.true;

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                expect(eventReceived).to.be.true;
                expect(eventCounter).to.be.at.least(5);
                await device.close(false);
                resolve();
            }, 30000);
        });
    }).timeout(35000);

    it('connect and bad header', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let timeout;
        await Promise.any([
            setTimeoutPromise(500).then(() => {
                timeout = true;
            }),
            device.login('BADHEADER'),
        ]);

        expect(timeout).to.be.true;

        await device.close(false);
    });

    it('connect and short header', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let timeout;
        await Promise.any([
            setTimeoutPromise(500).then(() => {
                timeout = true;
            }),
            device.login('SHORTHEADER'),
        ]);

        expect(timeout).to.be.true;

        await device.close(false);
    });

    it('connect and short length', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let err;
        await Promise.any([
            new Promise(resolve => {
                device.on('error', resolve);
            }).then(_err => {
                err = _err;
            }),
            device.login('SHORTLENGTH'),
        ]);

        expect(err).to.be.equal('Ignore data package because invalid length')

        await device.close(false);
    });

    it('connect and bad message type', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let err;
        await Promise.any([
            new Promise(resolve => {
                device.on('error', resolve);
            }).then(_err => {
                err = _err;
            }),
            device.login('BADDATA'),
        ]);

        expect(err).to.be.equal('Ignore data package because invalid message type 255')

        await device.close(false);
    });

    it('connect and short data', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let err;
        await Promise.any([
            new Promise(resolve => {
                device.on('error', resolve);
            }).then(_err => {
                err = _err;
            }),
            device.login('SHORTDATA'),
        ]);

        expect(err).to.be.equal('Ignore data package because invalid length')

        await device.close(false);
    });

    it('connect and login, get additional data', async () => {
        const device = new PH803WDevice('127.0.0.1');
        await device.connect();

        let data;
        await Promise.all([
            new Promise(resolve => {
                device.on('data', resolve);
            }).then(async _data => {
                data = _data;
            }),
            device.login('DOTHESPLIT'),
        ])

        expect(data).to.exist;
        expect(data.ph).to.equal(7.32);
        expect(data.redox).to.equal(205);
        expect(data.phOutlet).to.be.true;
        expect(data.redoxOutlet).to.be.true;

        await device.close(false);
    });

    after('shutdown server', async () => {
        await testServer.close();
    });

});
