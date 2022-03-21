class BaseReader {
  constructor() {
    /**
     * instanceof would be nice here, but when a user use multi version of Reader that may cause problem
     * @example
     * const { Reader } = require('ckb-js-toolkit'); // ckb-js-toolkit@0.100.1
     * const { readSomething } = require('other-serializer-lib'); // dependent on ckb-js-toolkit@0.100.0
     *
     * readSomething() instanceof Reader; // false
     *
     * @type {boolean}
     * @protected
     */
    this.__isByteLikeReader__ = true;
  }

  static isReader(x) {
    if (x == null) return false;
    if (x instanceof BaseReader) return true;
    return x.__isByteLikeReader__ === true;
  }
}

class ArrayBufferReader extends BaseReader {
  constructor(buffer) {
    super();
    this.view = new DataView(buffer);
  }

  length() {
    return this.view.byteLength;
  }

  indexAt(i) {
    return this.view.getUint8(i);
  }

  toArrayBuffer() {
    return this.view.buffer;
  }

  serializeJson() {
    return (
      "0x" +
      Array.prototype.map
        .call(new Uint8Array(this.view.buffer), (x) =>
          ("00" + x.toString(16)).slice(-2)
        )
        .join("")
    );
  }
}

class HexStringReader extends BaseReader {
  constructor(string) {
    super();
    this.string = string;
  }

  length() {
    return this.string.length / 2 - 1;
  }

  indexAt(i) {
    return parseInt(this.string.substr(2 + i * 2, 2), 16);
  }

  toArrayBuffer() {
    const buffer = new ArrayBuffer(this.length());
    const view = new DataView(buffer);

    for (let i = 0; i < this.length(); i++) {
      view.setUint8(i, this.indexAt(i));
    }
    return buffer;
  }

  serializeJson() {
    return this.string;
  }
}

export class Reader extends BaseReader {
  constructor(input) {
    super();
    if (
      input instanceof HexStringReader ||
      input instanceof ArrayBufferReader
    ) {
      return input;
    }
    if (typeof input === "string") {
      if (!input.startsWith("0x") || input.length % 2 !== 0) {
        throw new Error(
          "Hex string must start with 0x, and has even numbered length!"
        );
      }
      return new HexStringReader(input);
    }
    if (input instanceof ArrayBuffer) {
      return new ArrayBufferReader(input);
    }
    if (input instanceof Uint8Array) {
      return new ArrayBufferReader(Uint8Array.from(input).buffer);
    }
    throw new Error("Reader can only accept hex string or ArrayBuffer!");
  }

  static from(x) {
    return new Reader(x);
  }

  static fromRawString(string) {
    const buffer = new ArrayBuffer(string.length);
    const view = new DataView(buffer);

    for (let i = 0; i < string.length; i++) {
      const c = string.charCodeAt(i);
      if (c > 0xff) {
        throw new Error("fromRawString can only accept UTF-8 raw string!");
      }
      view.setUint8(i, c);
    }
    return new ArrayBufferReader(buffer);
  }
}
