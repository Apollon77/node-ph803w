const EventEmitter = require('events');
const dgram = require('dgram');
const debug = require('debug')('ph803w:discovery');
const VarintBufferReader = require('./varint-buffer-reader');

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
     * @param {Buffer} message Received data
     * @param {dgram.RemoteInfo} remote Information on remote client that responded
     * @private
     */
    _parseResponse(message, remote) {
        const messageReader = new VarintBufferReader(message);
        if (messageReader.nextUInt32BE() !== 0x00000003) {
            debug(`Ignore message because invalid prefix: ${message.toString('hex')}`);
            return;
        }
        const dataLength = messageReader.nextVarint();

        const data = messageReader.restAll();
        if (data.length !== dataLength) {
            debug(`Ignore message because invalid length: ${message.toString('hex')}`);
            this.emit('error', `Ignore message because invalid length`, message);
            return;
        }

        const dataReader = new VarintBufferReader(data);
        const flag = dataReader.nextInt8();
        if (flag !== 0x00) {
            debug(`Ignore data package because invalid flag ${flag}: ${message.toString('hex')}`);
            return;
        }
        const messageType = dataReader.nextInt16BE();
        switch (messageType) {
            case 0x03:  // OnDiscover
                break;
            case 0x04:  // ReplyBroadcast
                this._handleReplyBroadcast(dataReader.restAll(), remote);
                break;
            default:
                // there might be other packages being returned, ignore them
                debug(`Ignore data package because invalid message type ${messageType}: ${message.toString('hex')}`);
                return;
        }
    }

    /**
     * Handle a Reply Broadbast
     *
     * @param {Buffer} data Received data
     * @param {dgram.RemoteInfo} remote Information on remote client that responded
     * @private
     */
     _handleReplyBroadcast(data, remote) {
        debug('Parsing discovered device: ' + remote.address + ':' + remote.port + ' - ' + data.toString('hex'));
        const dataReader = new VarintBufferReader(data);

        const id = dataReader.nextString(dataReader.nextUInt16BE(), 'ascii');

        const data1 = dataReader.nextBuffer(dataReader.nextUInt16BE());
        const data2 = dataReader.nextString(dataReader.nextUInt16BE(), 'ascii');
        const data3 = dataReader.nextString(dataReader.nextUInt16BE(), 'ascii');
        dataReader.nextBuffer(8); // skip mcu attributes

        const apiServer = dataReader.nextStringZero('ascii');
        const version = dataReader.nextStringZero('ascii');
        const data4 = dataReader.restAll();

        const result = {
            ip: remote.address,
            id: id,
            data1: data1.toString('hex'),
            data2: data2,
            data3: data3,
            apiServer: apiServer,
            version: version,
            data4: data4.toString('latin1'),
        };
        debug(`Discovered device: ${JSON.stringify(result)}`);

        /**
         * Device Event emitted when device was discovered
         *
         * @param {dgram.RemoteInfo} result Object with response data
         * @param {string} result.ip IP of the discovered device
         * @param {string} result.id Unique ID of the device - also used for MQTT messages to the Cloud server
         * @param {string} result.data1 Wifi MAC address as hex
         * @param {string} result.data2 Wifi Firmware version
         * @param {string} result.data3 Product Key
         * @param {string} result.apiServer API server
         * @param {string} result.version Version of the device Firmware (?)
         */
        this.emit('device', result);
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
