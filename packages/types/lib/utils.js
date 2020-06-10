const blake2b = require("blake2b");
const { Reader } = require("ckb-js-toolkit");

class CKBHasher {
  constructor() {
    this.hasher = blake2b(
      32,
      null,
      null,
      new Uint8Array(Reader.fromRawString("ckb-default-hash").toArrayBuffer())
    );
  }

  update(data) {
    this.hasher.update(new Uint8Array(new Reader(data).toArrayBuffer()));
    return this;
  }

  digestReader() {
    const out = new Uint8Array(32);
    this.hasher.digest(out);
    return new Reader(out.buffer);
  }

  digestHex() {
    return this.digestReader().serializeJson();
  }
}

function ckbHash(buffer) {
  const hasher = new CKBHasher();
  hasher.update(buffer);
  return hasher.digestReader();
}

/**
 *
 * @param {bigint} num bigint or number type can using BigInt() to convert to bigint
 * @returns {string} num in BigUInt64 litten endian
 */
function toBigUInt64LE(num) {
  num = BigInt(num);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(num);
  return `0x${buf.toString("hex")}`;
}

/**
 *
 * @param {hex} hex litten endian hex string start with 0x
 */
function readBigUInt64LE(hex) {
  const buf = Buffer.from(hex.slice(2), "hex");
  return buf.readBigUInt64LE();
}

module.exports = {
  CKBHasher,
  ckbHash,
  toBigUInt64LE,
  readBigUInt64LE,
};
