const EventEmitter = require('events');
const net = require('net');
const dgram = require('dgram');
const debug = require('debug')('ph803w:discovery');

const PH803W_UDP_PORT = 12414;

class PH803WDiscovery extends EventEmitter {

    constructor(options) {
        super();

        this.options = options || {};

        this.socket = null;
    }

    discover() {
        let promiseResponded = false;
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

            this.socket.on('message', (message, remote) => {
                this.parseResponse(message, remote);
            });

            this.socket.on('error', err => {
                debug('Can not Listen for UDP packages: ' + err);
                if (!promiseResponded) {
                    reject(err);
                    promiseResponded = true;
                }
                this.emit('error', err);
            });

            this.socket.bind(PH803W_UDP_PORT, this.options.listenAdress || '0.0.0.0', () => {
                if (!this.socket) {
                    return;
                }
                debug('Listen for local PH803W devices on port 12414');

                try {
                    this.socket.setBroadcast(true);
                } catch (e) {
                    this.socket.emit('error', e);
                }

                const probeData = Buffer.from('0000000303000003', 'hex');
                debug(`Send broadcast message ${probeData.toString('hex')}`);
                try {
                    this.socket.send(probeData, 0, probeData.length, PH803W_UDP_PORT, '255.255.255.255');
                } catch (e) {
                    this.socket.emit('error', e);
                }

                if (!promiseResponded) {
                    resolve(true);
                    promiseResponded = true;
                }
            });
        });
    }

    parseResponse(data, remote) {
        if (!(data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x00 && data[3] === 0x03)) {
            debug(`Ignore data package because invalid prefix: ${data.toString('hex')}`);
            return;
        }
        const dataLength = data[4];

        if (data.length !== dataLength + 5) {
            debug(`Ignore data package because invalid length: ${data.toString('hex')}`);
            this.emit('error', `Ignore data package because invalid length`, data);
            return;
        }

        if (data[7] === 0x03) {
            return;
        }
        if (data[7] !== 0x04) {
            debug(`Ignore data package because invalid message type ${data[7]}: ${data.toString('hex')}`);
            this.emit('error', `Ignore data package because invalid message type ${data[7]}`, data);
            return;
        }

        debug('Parsing discovered device: ' + remote.address + ':' + remote.port + ' - ' + data.toString('hex'));

        let dataIdx = 9;
        const id = this.readDataField(data, dataIdx, true, true);
        dataIdx += id.length + 2;

        const data1 = this.readDataField(data, dataIdx, true, true);
        dataIdx += data1.length + 2;
        const data2 = this.readDataField(data, dataIdx, true, true);
        dataIdx += data2.length + 2;
        const data3 = this.readDataField(data, dataIdx, true, true);
        dataIdx += data3.length + 2;

        dataIdx += 7;

        let apiServer = this.readDataField(data, dataIdx, false, true);
        dataIdx += apiServer.length + 1;
        let version = this.readDataField(data, dataIdx, false, true);

        const result = {
            ip: remote.address,
            id: id.toString('ascii'),
            data1: data1.toString('hex'),
            data2: data2.toString('hex'),
            data3: data3.toString('ascii'),
            apiServer: apiServer.toString('ascii'),
            version: version.toString('ascii')
        };
        debug(`Discovered device: ${JSON.stringify(result)}`);

        this.emit('device', result);
    }

    readDataField(data, startPos, withLength, nullTerminated) {
        let length;
        if (withLength) {
            length = data[startPos];
            startPos++;
        } else if (nullTerminated) {
            length = 0;
            while (data[startPos + length] !== 0x00) {
                length++;
            }
        }
        const resBuf = Buffer.allocUnsafe(length);
        data.copy(resBuf, 0, startPos, startPos + length);
        return resBuf;
    }

    stop() {
        return new Promise(resolve => {
            if (this.socket) {
                this.socket.close(() => {
                    resolve(true);
                });
            } else {
                resolve(true);
            }
        });
    }
}

module.exports = PH803WDiscovery;
