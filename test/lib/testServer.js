const net = require('net');
const debug = require('debug')('ph803w:testServer');

const DEFAULT_PORT = 12416;

const requestResponse = {
    '0000000303000006': Buffer.from('000000030f000007000a49505152535455565758', 'hex'), // Passcode 06/07
    '000000030f000008000a49505152535455565758':  Buffer.from('000000030400000900', 'hex'), // Login OK
    '000000030f000008000a49505152535455565759':  Buffer.from('000000030400000901', 'hex'), // Login Error
    '0000000303000015':  Buffer.from('0000000303000016', 'hex'), // Ping, Pong 15/16
    '000000030400009002':  Buffer.from('000000030d000091030302dc089d00000000', 'hex') // Ping, Pong 15/16
};

const dataResponses = [
    Buffer.from('000000030d000091040002dc097700000000', 'hex'),
    Buffer.from('000000030d000091040202dc089d00000000', 'hex'),
    Buffer.from('000000030d000091040302ef090000000000', 'hex'),
    Buffer.from('000000030d000091040101dc089d00000000', 'hex'),
    Buffer.from('000000030d000091030002dc089d00000000', 'hex')
];

class TestServer {
    constructor(options) {
        this.options = options || {};

        this.lastDataPackets = [];
        this.lastPingTime = null;
        this.sockets = [];

        this.dataSendTimeout = null;
    }

    open() {
        let connected = false;
        return new Promise((resolve, reject) => {
            this.server = net.createServer(socket => this.handleSocketData(socket));
            this.server.on('error', err => {
                if (!connected) {
                    reject(err);
                    return;
                }
                // Handle errors here.
                throw err;
            });

            this.server.listen(this.options.port || DEFAULT_PORT, '127.0.0.1', () => {
                debug(`listening on ${JSON.stringify(this.server.address())}`);
                connected = true;
                resolve(true);
            });
        });
    }

    close() {
        return new Promise(resolve => {
            this.sockets.forEach(sock => sock.destroy());
            this.server.close(() => {
                debug('closed');
                resolve(true);
            });
        });
    }

    handleSocketData(socket) {
        debug('socket connected');
        this.sockets.push(socket);
        socket.on('data', data => {
            const dataStr = data.toString('hex');
            debug(`got data: ${dataStr}`);
            if (data[7] === 0x15) {
                this.lastPingTime = Date.now();
            } else {
                this.lastDataPackets.push(dataStr);
            }
            if (requestResponse[dataStr]) {
                debug(`response data: ${requestResponse[dataStr].toString('hex')}`);
                socket.write(requestResponse[dataStr]);

                if (dataStr === '000000030400009002' && !this.dataSendTimeout) {
                    this.sendDataPerInterval(socket);
                }
            }
        });

        socket.on('close', () => debug('socket closed'));
    }

    sendDataPerInterval(socket, timeout) {
        this.dataSendTimeout = setTimeout(() => {
            socket.write(dataResponses[Math.floor(Math.random() * dataResponses.length)]);
            this.sendDataPerInterval(socket, 6000);
        }, timeout || 6000);
    }

    resetLastDataPackets() {
        this.lastDataPackets = [];
    }
}

module.exports = TestServer;