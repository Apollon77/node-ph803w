const EventEmitter = require('events');
const net = require('net');
const debug = require('debug')('ph803w:device');

const PH803W_DEFAULT_TCP_PORT = 12416;
const PH803W_PING_INTERVAL = 4000;
const RECONNECT_DELAY = 10000;
const RESPONSE_TIMEOUT = 5000;

function getDeferredPromise() {
    let res;
    let rej;

    const resultPromise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });

    resultPromise.resolve = res;
    resultPromise.reject = rej;

    return resultPromise;
}

class PH803WDevice extends EventEmitter {

    constructor(ip, options) {
        super();

        if (typeof ip === 'object') {
            options = ip;
            ip = null;
        }
        this.options = options || {};
        if (!ip) {
            throw new Error('No IP provided for Device');
        }
        this.options.ip = ip;

        this.socket = null;
        this.pingTimeout = null;
        this.pingWaitTimeout = null;
        this.autoReconnect = this.options.autoReconnect !== undefined ? this.options.autoReconnect : true;
        this.reconnectTimeout = null;

        this.expectedResponsePromises = {};
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (this.socket) {
                reject(new Error('Already connected to device'));
                return;
            }

            this.socket = new net.Socket();

            const port = this.options.port || PH803W_DEFAULT_TCP_PORT;
            this.socket.connect(port, this.options.ip, () => {
                debug(`Connected to TCP ${this.options.ip}:${port}`);
                this.emit('connected');
                resolve(true);
            });

            this.socket.on('data', data => {
                if (!data || !Buffer.isBuffer(data)) {
                    return;
                }
                this.handleData(data);
            });

            this.socket.on('error', err => {
                debug('Socket error: ' + err);
                this.emit('error', err);
                this.socket = null;
                this.handleReconnect();
            });

            this.socket.on('end', () => {
                debug(`Socket end, Reconnect: ${this.autoReconnect}`);
                this.socket = null;
                this.handleReconnect();
            });
        });
    }

    handleReconnect() {
        if (this.reconnectTimeout) {
            return;
        }
        if (this.autoReconnect) {
            debug('Handle reconnect');
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            this.reconnectTimeout = setTimeout(() => {
                this.reconnectTimeout = null;
                this.connect();
            }, this.options.reconnectDelay || RECONNECT_DELAY);
        }
    }

    close(reconnect) {
        this.autoReconnect = reconnect;
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
        if (this.pingWaitTimeout) {
            clearTimeout(this.pingWaitTimeout);
            this.pingWaitTimeout = null;
        }
        Object.keys(this.expectedResponsePromises).forEach(res => {
            clearTimeout(this.expectedResponsePromises[res].responseTimeout);
            this.expectedResponsePromises[res].responsePromise.reject();
        });
        this.expectedResponsePromises = {};
        return new Promise(resolve => {
            if (this.socket) {
                debug('Destroy socket');
                this.socket.destroy();
                this.socket = null;
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                }
                if (this.autoReconnect) {
                    this.reconnectTimeout = setTimeout(() => {
                        this.reconnectTimeout = null;
                        this.connect();
                    }, this.options.reconnectDelay || RECONNECT_DELAY);
                }
            }
            resolve(true);
        });
    }

    destroy() {
        return this.close(false);
    }

    sendAndRegisterForResponse(reqBuffer, responseType) {
        if (!this.socket) {
            return;
        }

        if (this.expectedResponsePromises[responseType]) {
            return this.expectedResponsePromises[responseType].responsePromise;
        }

        debug(`Write and register for response type ${responseType}: ${reqBuffer.toString('hex')}`);
        this.socket.write(reqBuffer);

        const responsePromise = getDeferredPromise();

        this.expectedResponsePromises[responseType] = {
            responseType,
            responsePromise,
            responseTimeout: setTimeout(() => {
                if (this.expectedResponsePromises[responseType]) {
                    debug(`Reject registered responses for response type ${responseType}`);
                    this.expectedResponsePromises[responseType].responsePromise.reject();
                    delete this.expectedResponsePromises[responseType];
                }
            }, this.options.responseTimeout || RESPONSE_TIMEOUT)
        };
        return responsePromise;
    }

    resolveResponse(responseType, result) {
        if (!this.expectedResponsePromises[responseType]) {
            debug(`Ignore resolve for message type ${responseType} because no promise stored: ${JSON.stringify(result)}`);
            return;
        }
        debug(`Resolve for message type ${responseType}: ${JSON.stringify(result)}`);
        this.expectedResponsePromises[responseType].responsePromise.resolve(result);
        delete this.expectedResponsePromises[responseType];
    }

    rejectResponse(responseType, result) {
        if (!this.expectedResponsePromises[responseType]) {
            debug(`Ignore reject for message type ${responseType} because no promise stored: ${JSON.stringify(result)}`);
            return;
        }
        debug(`Reject for message type ${responseType}: ${JSON.stringify(result)}`);
        this.expectedResponsePromises[responseType].responsePromise.reject(result);
        delete this.expectedResponsePromises[responseType];
    }

    getPasscode() {
        const reqBuffer = Buffer.from('0000000303000006', 'hex');
        return this.sendAndRegisterForResponse(reqBuffer, 0x07);
    }

    async login(passcode) {
        if (passcode) {
            this.options.devicePasscode = passcode;
        }
        if (! this.options.devicePasscode) {
            this.options.devicePasscode = await this.getPasscode();
        }

        let passcodeBuffer;
        if (typeof this.options.devicePasscode === 'string') {
            passcodeBuffer = Buffer.from(this.options.devicePasscode, 'utf-8');
        } else if (Buffer.isBuffer(this.options.devicePasscode)) {
            passcodeBuffer = this.options.devicePasscode;
        } else {
            throw new Error(`Invalid passcode ${this.options.devicePasscode}`);
        }

        const loginBuffer = Buffer.from('00000003030000080000', 'hex');
        loginBuffer.writeUInt8(passcodeBuffer.length, loginBuffer.length - 1);
        loginBuffer.writeUInt8(5 + passcodeBuffer.length, 4);

        return this.sendAndRegisterForResponse(Buffer.concat([loginBuffer, passcodeBuffer]), 0x09);
    }

    retrieveData() {
        const dataBuffer = Buffer.from('000000030400009002', 'hex');

        return this.sendAndRegisterForResponse(dataBuffer, 0x91);
    }

    handleData(data) {
        if (!(data[0] === 0x00 && data[1] === 0x00 && data[2] === 0x00 && data[3] === 0x03)) {
            debug(`Ignore data package because invalid prefix: ${data}`);
            return;
        }
        const dataLength = data[4];
        const messageType = data[7];

        if (data.length !== dataLength + 5) {
            debug(`Ignore data package because invalid length: ${data}`);
            this.emit('error', `Ignore data package because invalid length`, data);
            return;
        }

        switch (messageType) {
            case 0x07:
                this.handlePasscodeResponse(data);
                break;
            case 0x09:
                this.handleLoginResponse(data);
                break;
            case 0x16:
                this.handlePingPongResponse();
                break;
            case 0x91:
                this.handleDataResponse(data);
                break;
            case 0x94:
                this.handleDataExtendedResponse(data);
                break;
            default:
                debug(`Ignore data package because invalid message type ${messageType}: ${data}`);
                this.emit('error', `Ignore data package because invalid message type ${messageType}`, data);
                return;
        }
    }

    handlePasscodeResponse(data) {
        const passcodeLength = data[9];
        const passcode = Buffer.alloc(passcodeLength);
        data.copy(passcode, 0, 10, 10 + passcodeLength);
        debug(`Passcode received: ${passcode}`);

        this.resolveResponse(0x07, passcode);
    }

    handleLoginResponse(data) {
        if (data[8] === 0x00) {
            debug('login success');
            this.resolveResponse(0x09, true);
            this.pingTimeout = setTimeout(() => {
                this.pingTimeout = null;
                this.sendPing();
            }, this.options.pingInterval || PH803W_PING_INTERVAL);
        } else {
            debug('login failed');
            this.rejectResponse(0x09, new Error('Login rejected by device, check the passcode'));
        }
    }

    handlePingPongResponse() {
        if (this.pingWaitTimeout) {
            clearTimeout(this.pingWaitTimeout);
            this.pingWaitTimeout = null;
        }
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
        debug('received pong');
        this.pingTimeout = setTimeout(() => {
            this.pingTimeout = null;
            this.sendPing();
        }, this.options.pingInterval || PH803W_PING_INTERVAL);
    }

    handleDataResponse(data) {
        // `00 00 00 03 0d 00 00 91 ?? ?? 02 dc 08 9d 00 00 00 00`
        const binFlags1 = data[8].toString(2);
        const binFlags2 = data[9].toString(2);
        const ph = data.readUInt16BE(10) / 100;
        const redox = data.readUInt16BE(12) - 2000;

        const res = {
            binFlags1,
            binFlags2,
            ph,
            redox,
            phSwitch: ((data[9]>>0) % 2 !== 0),
            redoxSwitch: ((data[9]>>1) % 2 !== 0)
        };
        debug(`Retrieved data: ${JSON.stringify(res)}`);
        this.emit('data', res);
        this.resolveResponse(0x91, res);
    }

    handleDataExtendedResponse(data) {
        // `00 00 00 03 11 00 00 94 00 00 00 04 03 00 02 dc 08 9d 00 00 00 00`
        const binFlags1 = data[12].toString(2);
        const binFlags2 = data[13].toString(2);
        const ph = data.readUInt16BE(14) / 100;
        const redox = data.readUInt16BE(16) - 2000;

        const res = {
            binFlags1,
            binFlags2,
            ph,
            redox,
            phSwitch: ((data[13]>>0) % 2 !== 0),
            redoxSwitch: ((data[13]>>1) % 2 !== 0)
        };
        debug(`Retrieved data: ${JSON.stringify(res)}`);
        this.emit('data', res);
        this.resolveResponse(0x94, res);
    }

    sendPing() {
        if (!this.socket) {
            return;
        }
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
        if (this.pingWaitTimeout) {
            clearTimeout(this.pingWaitTimeout);
            this.pingWaitTimeout = null;
        }
        const pingBuffer = Buffer.from('0000000303000015', 'hex');
        this.socket.write(pingBuffer);
        debug('Send ping');
        this.pingWaitTimeout = setTimeout(() => {
            debug('Ping response overdue, reconnect');
            this.close(true);
        }, (this.options.pingInterval || PH803W_PING_INTERVAL) * 2);
    }
}

module.exports = PH803WDevice;
