const BufferReader = require('buffer-reader');
const varint = require('varint');

class VarintBufferReader extends BufferReader {
  /**
   * @param {Buffer} [buffer]
  */
  constructor(buffer) {
      super(buffer);
      /** @type {Buffer} */
      this.buf;
  }

  nextVarint() {
      const val = varint.decode(this.buf, this.tell());
      this.move(varint.decode.bytes);
      return val;
  }
}

module.exports = VarintBufferReader;
