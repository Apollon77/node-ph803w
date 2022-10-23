const net = require('net');
const debug = require('debug')('ph803w:testServer');

const DEFAULT_PORT = 12416;

const requestResponse = {
    '0000000303000006': Buffer.from('000000030f000007000a49505152535455565758', 'hex'), // Passcode 06/07
    '000000030f000008000a49505152535455565758':  Buffer.from('000000030400000900', 'hex'), // Login OK
    '000000030f000008000a49505152535455565759':  Buffer.from('000000030400000901', 'hex'), // Login Error
    '000000030e0000080009424144484541444552':  Buffer.from('000000020400000900', 'hex'), // Bad header
    '0000000310000008000b53484f5254484541444552':  Buffer.from('000000', 'hex'), // Short header
    '0000000310000008000b53484f52544c454e475448':  Buffer.from('00000003FF', 'hex'), // Short length
    '000000030c000008000742414444415441':  Buffer.from('00000003030000FF', 'hex'), // Bad data
    '000000030e000008000953484f525444415441':  Buffer.from('0000000304000', 'hex'), // Short data
    '000000030f000008000a444f54484553504c4954':  Buffer.from('000000030400000900000000031100009412345678030302dc089d00000000', 'hex'), // Login OK, and additional Data 94
    '0000000303000015':  Buffer.from('0000000303000016', 'hex'), // Ping, Pong 15/16
    '000000030400009002':  Buffer.from('000000030d000091030302dc089d00000000', 'hex'), // Data transmit 90/91
    // '00000003040000931234567802':  Buffer.from('000000031100009412345678030302dc089d00000000', 'hex'), // Data control 93/94
};

const dataResponses = [
    Buffer.from('000000030d000091040002dc097700000000', 'hex'),
    Buffer.from('000000030d000091040202dc089d00000000', 'hex'),
    Buffer.from('000000030d000091040302ef090000000000', 'hex'),
    Buffer.from('000000030d000091040101dc089d00000000', 'hex'),
    Buffer.from('000000030d000091030002dc089d00000000', 'hex')
];

/**
 * Server to emulate a PH803W device for testing
 */
class TestServer {
    /**
     * Constructor
     *
     * @param {object} [options] Options object to set/overwrite some settings, IP needs to be provided as first parameter or as part of this object
     * @param {number} [options.port=12416] Port of the device, defaults to 12416 if not provided
     * @param {number} [options.bindAddress='127.0.0.1'] Bind address for the device, defaults to '127.0.0.1' if not provided
     */
    constructor(options) {
        this.options = options || {};

        this.lastDataPackets = [];
        this.lastPingTime = null;
        this.sockets = [];

        this.dataSendTimeout = null;
    }

    /**
     * Open TCP server
     *
     * @returns {Promise<boolean>}
     */
    open() {
        let connected = false;
        return new Promise((resolve, reject) => {
            this.server = net.createServer(socket => this._handleSocketData(socket));
            this.server.on('error', err => {
                if (!connected) {
                    reject(err);
                    return;
                }
                // Handle errors here.
                throw err;
            });

            this.server.listen(this.options.port || DEFAULT_PORT, this.options.bindAddress || '127.0.0.1', () => {
                debug(`listening on ${JSON.stringify(this.server.address())}`);
                connected = true;
                resolve(true);
            });
        });
    }

    /**
     * Close TCP server
     *
     * @returns {Promise<boolean>}
     */
    close() {
        return new Promise(resolve => {
            try {
                this.sockets.forEach(sock => sock.destroy());
            } catch {
                // ignore
            }
            this.server.close(() => {
                debug('closed');
                resolve(true);
            });
        });
    }

    /**
     * Handle connected Sockets and handle prepared responses
     *
     * @param {Socket} socket connected Socket
     * @private
     */
    _handleSocketData(socket) {
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
                    this._sendDataPerInterval(socket);
                }
            } else {
                debug('ERROR: unexpected data!');
            }
        });

        socket.on('close', () => {
            debug('socket closed');
            clearTimeout(this.dataSendTimeout);
        });

        socket.on('error', err => debug(`socket errored: ${err}`));
    }

    /**
     * Send new data in regular intervals
     *
     * @param {Socket} socket Socket to send data to
     * @param {number} timeout Timeout in ms in which data are sent
     * @private
     */
    _sendDataPerInterval(socket, timeout) {
        this.dataSendTimeout = setTimeout(() => {
            const data = dataResponses[Math.floor(Math.random() * dataResponses.length)];
            debug(`Send out random new data: ${data.toString('hex')}`);
            socket.write(data);
            this._sendDataPerInterval(socket, 6000);
        }, timeout || 6000);
    }

    /**
     * Reset the collected "lastDataPackets"
     */
    resetLastDataPackets() {
        this.lastDataPackets = [];
    }
}

module.exports = TestServer;