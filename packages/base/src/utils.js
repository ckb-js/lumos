const blake2b = require("blake2b");
const isEqual = require("lodash.isequal");
const { xxHash32 } = require("js-xxhash");
const { bytes, number } = require("@ckb-lumos/codec");
const blockchain = require("./blockchain");

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
  const outputIndexBuf = bytes.hexify(number.Uint64LE.pack(outputIndex));
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
        result[toCamel(key)] = value;
      }
    }
    return result;
  }
  return data;
}

function deepCamelizeTransaction(data) {
  if (Object.prototype.toString.call(data) === "[object Array]") {
    if (data.length === 0) {
      return data;
    } else {
      return data.map((item) => deepCamelizeTransaction(item));
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
        result[key] = deepCamelizeTransaction(value);
      } else {
        result[key] = value === "dep_group" ? "depGroup" : value;
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
  deepCamelizeTransaction,
  computeScriptHash,
  hashCode,
  assertHexString,
  assertHexadecimal,
  isDeepEqual,
  generateTypeIdScript,
};
