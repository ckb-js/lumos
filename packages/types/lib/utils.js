const blake2b = require("blake2b");
import { Reader } from "ckb-js-toolkit";

function ckbHasher() {
  return blake2b(
    32,
    null,
    null,
    new Uint8Array(Reader.fromRawString("ckb-default-hash").toArrayBuffer())
  );
}

function ckbHash(buffer) {
  buffer = new Reader(buffer).toArrayBuffer();
  const h = ckbHasher();
  h.update(new Uint8Array(buffer));
  const out = new Uint8Array(32);
  h.digest(out);
  return new Reader(out.buffer);
}

module.exports = {
  ckbHash,
};
