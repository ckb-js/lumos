const blake2b = require("blake2b");
const { validators, normalizers, Reader } = require("ckb-js-toolkit");
const { SerializeScript } = require("./core");
const { xxHash32 } = require("js-xxhash");

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

function toBigUInt64LE(num) {
  num = BigInt(num);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(num);
  return `0x${buf.toString("hex")}`;
}

function readBigUInt64LE(hex) {
  const buf = Buffer.from(hex.slice(2), "hex");
  return buf.readBigUInt64LE();
}

const U128_MIN = BigInt(0);
const U128_MAX = BigInt(2) ** BigInt(128) - BigInt(1);
function toBigUInt128LE(u128) {
  if (u128 < U128_MIN) {
    throw new Error(`u128 ${u128} too small`);
  }
  if (u128 > U128_MAX) {
    throw new Error(`u128 ${u128} too large`);
  }
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(u128 & BigInt("0xFFFFFFFFFFFFFFFF"), 0);
  buf.writeBigUInt64LE(u128 >> BigInt(64), 8);
  return "0x" + buf.toString("hex");
}

function readBigUInt128LE(leHex) {
  if (leHex.length !== 34 || !leHex.startsWith("0x")) {
    throw new Error(`leHex format error`);
  }
  const buf = Buffer.from(leHex.slice(2), "hex");
  return (buf.readBigUInt64LE(8) << BigInt(64)) + buf.readBigUInt64LE(0);
}

function computeScriptHash(script, { validate = true } = {}) {
  if (validate) {
    validators.ValidateScript(script);
  }

  return ckbHash(
    new Reader(SerializeScript(normalizers.NormalizeScript(script)))
  ).serializeJson();
}

function hashCode(buffer) {
  return xxHash32(buffer, 0);
}

function assertHexString(debugPath, str) {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(str)) {
    throw new Error(`${debugPath} must be a hex string!`);
  }
}

function assertHexadecimal(debugPath, str) {
  if (!/^0x(0|[0-9a-fA-F]+)$/.test(str)) {
    throw new Error(`${debugPath} must be a hexadecimal!`);
  }
}

module.exports = {
  CKBHasher,
  ckbHash,
  toBigUInt64LE,
  readBigUInt64LE,
  toBigUInt128LE,
  readBigUInt128LE,
  computeScriptHash,
  hashCode,
  assertHexString,
  assertHexadecimal,
};
