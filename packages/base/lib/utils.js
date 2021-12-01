const blake2b = require("blake2b");
const { JSBI, maybeJSBI } = require("./primitive");
const { validators, normalizers, Reader } = require("ckb-js-toolkit");
const { SerializeScript } = require("./core");
const { xxHash32 } = require("js-xxhash");
const isEqual = require("lodash.isequal");

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
  num = JSBI.BigInt(num);
  const buf = Buffer.alloc(8);
  buf.writeUInt32LE(
    JSBI.toNumber(JSBI.bitwiseAnd(num, JSBI.BigInt("0xffffffff"))),
    0
  );
  num = JSBI.signedRightShift(num, JSBI.BigInt(32));
  buf.writeUInt32LE(
    JSBI.toNumber(JSBI.bitwiseAnd(num, JSBI.BigInt("0xffffffff"))),
    4
  );
  return `0x${buf.toString("hex")}`;
}

function readBigUInt64LE(hex) {
  const buf = Buffer.from(hex.slice(2), "hex");
  return JSBI.add(
    JSBI.BigInt(buf.readUInt32LE()),
    JSBI.leftShift(JSBI.BigInt(buf.readUInt32LE(4)), JSBI.BigInt(32))
  );
}

const U128_MIN = JSBI.BigInt(0);
const U128_MAX = JSBI.subtract(
  JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
  JSBI.BigInt(1)
);

function toBigUInt128LE(num) {
  num = JSBI.BigInt(num);
  if (maybeJSBI.lessThan(num, U128_MIN)) {
    throw new Error(`u128 ${num} too small`);
  }

  if (maybeJSBI.greaterThan(num, U128_MAX)) {
    throw new Error(`u128 ${num} too large`);
  }

  const buf = Buffer.alloc(16);
  buf.writeUInt32LE(
    JSBI.toNumber(JSBI.bitwiseAnd(num, JSBI.BigInt("0xffffffff"))),
    0
  );
  num = JSBI.signedRightShift(num, JSBI.BigInt(32));
  buf.writeUInt32LE(
    JSBI.toNumber(JSBI.bitwiseAnd(num, JSBI.BigInt("0xffffffff"))),
    4
  );

  num = JSBI.signedRightShift(num, JSBI.BigInt(32));
  buf.writeUInt32LE(
    JSBI.toNumber(JSBI.bitwiseAnd(num, JSBI.BigInt("0xffffffff"))),
    8
  );

  num = JSBI.signedRightShift(num, JSBI.BigInt(32));
  buf.writeUInt32LE(
    JSBI.toNumber(JSBI.bitwiseAnd(num, JSBI.BigInt("0xffffffff"))),
    12
  );
  return `0x${buf.toString("hex")}`;
}

function readBigUInt128LE(leHex) {
  if (leHex.length < 34 || !leHex.startsWith("0x")) {
    throw new Error(`leHex format error`);
  }

  const buf = Buffer.from(leHex.slice(2, 34), "hex");

  return JSBI.add(
    JSBI.add(
      JSBI.add(
        JSBI.leftShift(JSBI.BigInt(buf.readUInt32LE(0)), JSBI.BigInt(0)),
        JSBI.leftShift(JSBI.BigInt(buf.readUInt32LE(4)), JSBI.BigInt(32))
      ),
      JSBI.leftShift(JSBI.BigInt(buf.readUInt32LE(8)), JSBI.BigInt(64))
    ),
    JSBI.leftShift(JSBI.BigInt(buf.readUInt32LE(12)), JSBI.BigInt(96))
  );
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

function isDeepEqual(a, b) {
  return isEqual(a, b);
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
  isDeepEqual,
};
