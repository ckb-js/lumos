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

module.exports = {
  CKBHasher,
  ckbHash,
};
