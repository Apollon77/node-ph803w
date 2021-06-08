const dgram = require('dgram');
const debug = require('debug')('ph803w:testUdpServer');

const DEFAULT_UDP_PORT = 12414;

const requestResponse = {
    '0000000303000003': Buffer.from('00000003680000040016434671704a5453796d434539504c6c703144706268590006483fda87dc4700000020326433643935346439626237343162346131396261313135333130343933326200000000000000026170692e67697a776974732e636f6d3a383000342e302e3800', 'hex')
};

/**
 * Server to emulate a PH803W device for discovery for testing
 */
class TestServer {
    /**
     * Constructor
     */
    constructor() {
        this.lastDataPackets = [];
        this.lastPingTime = null;
        this.server = null;
    }

    /**
     * Start server
     *
     * @returns {Promise<boolean>}
     */
    open() {
        let promiseResponded = false;
        return new Promise((resolve, reject) => {
            this.server = dgram.createSocket({type: 'udp4', reuseAddr: true});

            this.server.on('message', (message, remote) => {
                this._handleUdpData(message, remote);
            });

            this.server.on('error', err => {
                debug('Can not Listen for UDP packages: ' + err);
                if (!promiseResponded) {
                    reject(err);
                    promiseResponded = true;
                }
                this.emit('error', err);
            });

            this.server.bind(DEFAULT_UDP_PORT, undefined, () => {
                if (!this.server) {
                    return;
                }
                debug(`Listen for udp packages on port ${DEFAULT_UDP_PORT}`);

                if (!promiseResponded) {
                    resolve(true);
                    promiseResponded = true;
                }
            });
        });
    }

    /**
     * Close server
     *
     * @returns {Promise<boolean>}
     */
    close() {
        return new Promise(resolve => {
            this.server.close(() => {
                debug('closed');
                resolve(true);
            });
        });
    }

    /**
     * Handle incoming UDP Messages
     *
     * @param {Buffer} data Incoming message
     * @param {Object} remote Information about connected client
     * @private
     */
    _handleUdpData(data, remote) {
        debug(`udp packet received: ${data.toString('hex')} from ${remote.address}:${remote.port}`);
        const dataStr = data.toString('hex');
        this.lastDataPackets.push(dataStr);
        if (requestResponse[dataStr]) {
            debug(`response data: ${requestResponse[dataStr].toString('hex')}`);
            try {
                this.server.send(requestResponse[dataStr], 0, requestResponse[dataStr].length, remote.port, remote.address);
            } catch (e) {
                this.server.emit('error', e);
            }
        }
    }

    /**
     * Reset the collected "lastDataPackets"
     */
    resetLastDataPackets() {
        this.lastDataPackets = [];
    }
}

module.exports = TestServer;