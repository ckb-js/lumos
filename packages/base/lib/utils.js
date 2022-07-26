const blake2b = require("blake2b");
const isEqual = require("lodash.isequal");
const { xxHash32 } = require("js-xxhash");
const { BI } = require("@ckb-lumos/bi");
const { bytes, blockchain } = require("@ckb-lumos/codec");

const { bytify, hexify, bytifyRawString } = bytes;
class CKBHasher {
  constructor() {
    this.hasher = blake2b(32, null, null, bytifyRawString("ckb-default-hash"));
  }

  update(data) {
    this.hasher.update(bytify(data));
    return this;
  }

  digestHex() {
    const out = new Uint8Array(32);
    this.hasher.digest(out);
    return hexify(out.buffer);
  }
}

function ckbHash(buffer) {
  const hasher = new CKBHasher();
  hasher.update(buffer);
  return hasher.digestHex();
}

function toBigUInt64LE(num) {
  return toBigUInt64LECompatible(num);
}

function toBigUInt64LECompatible(num) {
  num = BI.from(num);
  const buf = Buffer.alloc(8);
  buf.writeUInt32LE(num.and("0xffffffff").toNumber(), 0);
  num = num.shr(32);
  buf.writeUInt32LE(num.and("0xffffffff").toNumber(), 4);
  return `0x${buf.toString("hex")}`;
}

function readBigUInt64LE(hex) {
  return readBigUInt64LECompatible(hex).toBigInt();
}

function readBigUInt64LECompatible(hex) {
  const buf = Buffer.from(hex.slice(2), "hex");
  return BI.from(buf.readUInt32LE()).add(BI.from(buf.readUInt32LE(4)).shl(32));
}

// const U128_MIN = BigInt(0);
// const U128_MAX = BigInt("340282366920938463463374607431768211455");
function toBigUInt128LE(u128) {
  return toBigUInt128LECompatible(u128);
}

const U128_MIN_COMPATIBLE = BI.from(0);
const U128_MAX_COMPATIBLE = BI.from("340282366920938463463374607431768211455");
function toBigUInt128LECompatible(num) {
  num = BI.from(num);
  if (num.lt(U128_MIN_COMPATIBLE)) {
    throw new Error(`u128 ${num} too small`);
  }

  if (num.gt(U128_MAX_COMPATIBLE)) {
    throw new Error(`u128 ${num} too large`);
  }

  const buf = Buffer.alloc(16);
  buf.writeUInt32LE(num.and(0xffffffff).toNumber(), 0);
  num = num.shr(32);
  buf.writeUInt32LE(num.and(0xffffffff).toNumber(), 4);

  num = num.shr(32);
  buf.writeUInt32LE(num.and(0xffffffff).toNumber(), 8);

  num = num.shr(32);
  buf.writeUInt32LE(num.and(0xffffffff).toNumber(), 12);
  return `0x${buf.toString("hex")}`;
}

function readBigUInt128LE(leHex) {
  return readBigUInt128LECompatible(leHex).toBigInt();
}

function readBigUInt128LECompatible(leHex) {
  if (leHex.length < 34 || !leHex.startsWith("0x")) {
    throw new Error(`leHex format error`);
  }

  const buf = Buffer.from(leHex.slice(2, 34), "hex");

  return BI.from(buf.readUInt32LE(0))
    .shl(0)
    .add(BI.from(buf.readUInt32LE(4)).shl(32))
    .add(BI.from(buf.readUInt32LE(8)).shl(64))
    .add(BI.from(buf.readUInt32LE(12)).shl(96));
}

function computeScriptHash(script) {
  return ckbHash(blockchain.Script.pack(script));
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
// Buffer.from('TYPE_ID')
const TYPE_ID_CODE_HASH =
  "0x00000000000000000000000000000000000000000000000000545950455f4944";

function generateTypeIdArgs(input, outputIndex) {
  const outPointBuf = blockchain.CellInput.pack(input);
  const outputIndexBuf = toBigUInt64LE(outputIndex);
  const ckbHasher = new CKBHasher();
  ckbHasher.update(outPointBuf);
  ckbHasher.update(outputIndexBuf);
  return ckbHasher.digestHex();
}

function generateTypeIdScript(input, outputIndex = "0x0") {
  blockchain.CellInput.pack(input);
  assertHexadecimal("outputIndex", outputIndex);

  const args = generateTypeIdArgs(input, outputIndex);
  return {
    codeHash: TYPE_ID_CODE_HASH,
    hashType: "type",
    args,
  };
}

function toCamel(s) {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
}

function deepCamel(data) {
  if (Object.prototype.toString.call(data) === "[object Array]") {
    if (data.length === 0) {
      return data;
    } else {
      return data.map((item) => deepCamel(item));
    }
  }
  let result = {};
  if (Object.prototype.toString.call(data) === "[object Object]") {
    for (let key in data) {
      const value = data[key];
      if (
        Object.prototype.toString.call(value) === "[object Object]" ||
        Object.prototype.toString.call(value) === "[object Array]"
      ) {
        result[toCamel(key)] = deepCamel(value);
      } else {
        result[toCamel(key)] = value === "dep_group" ? "depGroup" : value;
      }
    }
    return result;
  }
  return data;
}

module.exports = {
  CKBHasher,
  ckbHash,
  deepCamel,
  toBigUInt64LE,
  toBigUInt64LECompatible,
  readBigUInt64LE,
  readBigUInt64LECompatible,
  toBigUInt128LE,
  toBigUInt128LECompatible,
  readBigUInt128LE,
  readBigUInt128LECompatible,
  computeScriptHash,
  hashCode,
  assertHexString,
  assertHexadecimal,
  isDeepEqual,
  generateTypeIdScript,
};
