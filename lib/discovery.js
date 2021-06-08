const EventEmitter = require('events');
const dgram = require('dgram');
const debug = require('debug')('ph803w:discovery');

const PH803W_UDP_PORT = 12414;

/**
 * This class allows to discover PH803W devices in the same network via UDP messages
 */
class PH803WDiscovery extends EventEmitter {

    /**
     * Constructor for PH803W device
     *
     * @param {object} [options] Options object to set/overwrite some settings, IP needs to be provided as first parameter or as part of this object
     * @param {string} [options.listenAddress='0.0.0.0'] network interface to listen on
     */
    constructor(options) {
        super();

        this.options = options || {};

        this.socket = null;
    }

    /**
     * Start UDP Discovery server and start discovering devices
     * Event "device" is emitted when a device responds. One IP can be discovered multiple times!
     *
     * @returns {Promise<boolean>}
     */
    discover() {
        let promiseResponded = false;
        return new Promise((resolve, reject) => {
            this.socket = dgram.createSocket({type: 'udp4', reuseAddr: true});

            this.socket.on('message', (message, remote) => {
                this._parseResponse(message, remote);
            });

            this.socket.on('error', err => {
                debug('Can not Listen for UDP packages: ' + err);
                if (!promiseResponded) {
                    reject(err);
                    promiseResponded = true;
                }
                this.emit('error', err);
            });

            this.socket.bind(undefined, this.options.listenAddress || '0.0.0.0', () => {
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

    /**
     * Handle Discovery response messages
     *
     * @param {Buffer} data Received data
     * @param {Object} remote Information on remote client that responded
     * @private
     */
    _parseResponse(data, remote) {
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
            // there might be other packages being returned, ignore them
            debug(`Ignore data package because invalid message type ${data[7]}: ${data.toString('hex')}`);
            return;
        }

        debug('Parsing discovered device: ' + remote.address + ':' + remote.port + ' - ' + data.toString('hex'));

        let dataIdx = 9;
        const id = this._readDataField(data, dataIdx, true, true);
        dataIdx += id.length + 2;

        const data1 = this._readDataField(data, dataIdx, true, true);
        dataIdx += data1.length + 2;
        const data2 = this._readDataField(data, dataIdx, true, true);
        dataIdx += data2.length + 2;
        const data3 = this._readDataField(data, dataIdx, true, true);
        dataIdx += data3.length + 2;

        dataIdx += 7;

        const apiServer = this._readDataField(data, dataIdx, false, true);
        dataIdx += apiServer.length + 1;
        const version = this._readDataField(data, dataIdx, false, true);

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

        /**
         * Device Event emitted when device was discovered
         *
         * @param {object} result Object with response data
         * @param {string} result.ip IP of the discovered device
         * @param {string} result.id Unique ID of the device - also used for MQTT messages to the Cloud server
         * @param {string} result.data1 Unknown Data packet 1 as hex String
         * @param {string} result.data2 Unknown Data packet 2 as hex String
         * @param {string} result.data3 Unknown Data packet 3 as hex String
         * @param {string} result.apiServer API server String
         * @param {string} result.version Version of the device Firmware (?)
         */
        this.emit('device', result);
    }

    /**
     * Helper method to parse a data field out of the response message
     *
     * @param {Buffer} data Data
     * @param {number} startPos start position for the data retieval
     * @param {boolean} withLength true if the datafield has a leading length field
     * @param {boolean} nullTerminated true if the datafield is a NULL terminated string
     * @returns {Buffer} Read datafield
     * @private
     */
    _readDataField(data, startPos, withLength, nullTerminated) {
        let length = 0;
        if (withLength) {
            length = data[startPos];
            startPos++;
        } else if (nullTerminated) {
            while (data[startPos + length] !== 0x00) {
                length++;
            }
        }
        const resBuf = Buffer.allocUnsafe(length);
        data.copy(resBuf, 0, startPos, startPos + length);
        return resBuf;
    }

    /**
     * Stop Discovery server
     *
     * @returns {Promise<boolean>} Resolves with true if successfully stopped
     */
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
