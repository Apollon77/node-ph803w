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
            debug(`Ignore data package because invalid prefix: ${data}`);
            return;
        }
        const dataLength = data[4];

        if (data.length !== dataLength + 5) {
            debug(`Ignore data package because invalid length: ${data}`);
            this.emit('error', `Ignore data package because invalid length`, data);
            return;
        }

        if (data[7] === 0x03) {
            return;
        }
        if (data[7] !== 0x04) {
            debug(`Ignore data package because invalid message type ${data[7]}`);
            this.emit('error', `Ignore data package because invalid message type ${data[7]}`, data);
            return;
        }

        debug('Parsing discovered device: ' + remote.address + ':' + remote.port + ' - ' + data.toString('hex'));

        const id1Length = data[9];
        const id1 = data.toString('utf-8', 10, 10 + id1Length); // 10..10+Length
        const id2Length = data[9 + id1Length + 12];
        const id2 = data.toString('utf-8', 9 + id1Length + 13, 9 + id1Length + 13 + id2Length); // 9+length+10 für 32 bytes

        let idx = 9 + id1Length + 13 + id2Length + 8;

        let apiServer = '';
        while (data[idx] !== 0x00) {
            apiServer += data.toString('utf-8', idx, idx + 1);
            idx++;
        }
        idx++;

        let version = '';
        while (data[idx] !== 0x00) {
            version += data.toString('utf-8', idx, idx + 1);
            idx++;
        }

        const result = {
            ip: remote.address,
            id1,
            id2,
            apiServer,
            version
        };
        debug(`Discovered device: ${JSON.stringify(result)}`);

        this.emit('device', result);
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
