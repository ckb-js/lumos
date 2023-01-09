import blake2b, { Blake2b } from "blake2b";
import isEqual from "lodash.isequal";
import { xxHash32 } from "js-xxhash";
import { bytes, number, BytesLike } from "@ckb-lumos/codec";
import { BI, BIish } from "@ckb-lumos/bi";
import * as blockchain from "./blockchain";
import { Script, Input } from "./api";
import { Hash, HexNumber, HexString } from "./primitive";

type CKBHasherOptions = {
  outLength?: number;
};

const { bytify, hexify, bytifyRawString } = bytes;
class CKBHasher {
  hasher: Blake2b;
  outLength: number;

  constructor(options: CKBHasherOptions = {}) {
    const { outLength = 32 } = options;
    this.outLength = outLength;
    this.hasher = blake2b(
      outLength,
      undefined,
      undefined,
      bytifyRawString("ckb-default-hash")
    );
  }

  update(data: string | ArrayBuffer): this {
    this.hasher.update(bytify(data));
    return this;
  }

  digestHex(): Hash {
    const out = new Uint8Array(this.outLength);
    this.hasher.digest(out);
    return hexify(out.buffer);
  }
}

function ckbHash(data: BytesLike): Hash {
  const hasher = new CKBHasher();
  hasher.update(bytes.bytify(data));
  return hasher.digestHex();
}

/**
 * compute lock/type hash
 *
 * @param script
 */
function computeScriptHash(script: Script): string {
  return ckbHash(blockchain.Script.pack(script));
}

function hashCode(buffer: Buffer): number {
  return xxHash32(buffer, 0);
}

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 * convert bigint to BigUInt64 little-endian hex string
 * @param num
 */
function toBigUInt64LE(num: BIish): HexString {
  return toBigUInt64LECompatible(num);
}

function toBigUInt64LECompatible(num: BIish): HexString {
  num = BI.from(num);
  const buf = Buffer.alloc(8);
  buf.writeUInt32LE(num.and("0xffffffff").toNumber(), 0);
  num = num.shr(32);
  buf.writeUInt32LE(num.and("0xffffffff").toNumber(), 4);
  return `0x${buf.toString("hex")}`;
}

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 * convert BigUInt64 little-endian hex string to bigint
 *
 * @param hex BigUInt64 little-endian hex string
 */
function readBigUInt64LE(hex: HexString): bigint {
  return readBigUInt64LECompatible(hex).toBigInt();
}

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function readBigUInt64LECompatible(hex: HexString): BI {
  const buf = Buffer.from(hex.slice(2), "hex");
  return BI.from(buf.readUInt32LE()).add(BI.from(buf.readUInt32LE(4)).shl(32));
}

// const U128_MIN = BigInt(0);
// const U128_MAX = BigInt("340282366920938463463374607431768211455");
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 * convert bigint to BigUInt128 little-endian hex string
 *
 * @param u128
 */
function toBigUInt128LE(u128: BIish): string {
  return toBigUInt128LECompatible(u128);
}

const U128_MIN_COMPATIBLE = BI.from(0);
const U128_MAX_COMPATIBLE = BI.from("340282366920938463463374607431768211455");
function toBigUInt128LECompatible(num: BIish): HexNumber {
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

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 * convert BigUInt64 little-endian hex string to bigint
 *
 * @param leHex BigUInt128 little-endian hex string
 */
function readBigUInt128LE(leHex: HexString): bigint {
  return readBigUInt128LECompatible(leHex).toBigInt();
}

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function readBigUInt128LECompatible(leHex: HexString): BI {
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

function assertHexString(debugPath: string, str: string): void {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(str)) {
    throw new Error(`${debugPath} must be a hex string!`);
  }
}

function assertHexadecimal(debugPath: string, str: string): void {
  if (!/^0x(0|[0-9a-fA-F]+)$/.test(str)) {
    throw new Error(`${debugPath} must be a hexadecimal!`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function isDeepEqual(a: any, b: any): boolean {
  return isEqual(a, b);
}
// Buffer.from('TYPE_ID')
const TYPE_ID_CODE_HASH =
  "0x00000000000000000000000000000000000000000000000000545950455f4944";

function generateTypeIdArgs(input: Input, outputIndex: HexNumber): HexString {
  const outPointBuf = blockchain.CellInput.pack(input);
  const outputIndexBuf = bytes.hexify(number.Uint64LE.pack(outputIndex));
  const ckbHasher = new CKBHasher();
  ckbHasher.update(outPointBuf);
  ckbHasher.update(outputIndexBuf);
  return ckbHasher.digestHex();
}

function generateTypeIdScript(input: Input, outputIndex = "0x0"): Script {
  blockchain.CellInput.pack(input);
  assertHexadecimal("outputIndex", outputIndex);

  const args = generateTypeIdArgs(input, outputIndex);
  return {
    codeHash: TYPE_ID_CODE_HASH,
    hashType: "type",
    args,
  };
}

function toCamel(s: string): string {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace("-", "").replace("_", "");
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function deepCamel(data: any): any {
  if (Object.prototype.toString.call(data) === "[object Array]") {
    if (data.length === 0) {
      return data;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((item: any) => deepCamel(item));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  if (Object.prototype.toString.call(data) === "[object Object]") {
    for (const key in data) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function deepCamelizeDepGroup(data: any): any {
  if (Object.prototype.toString.call(data) === "[object Array]") {
    if (data.length === 0) {
      return data;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((item: any) => deepCamelizeDepGroup(item));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = {};
  if (Object.prototype.toString.call(data) === "[object Object]") {
    for (const key in data) {
      const value = data[key];
      if (
        Object.prototype.toString.call(value) === "[object Object]" ||
        Object.prototype.toString.call(value) === "[object Array]"
      ) {
        result[key] = deepCamelizeDepGroup(value);
      } else {
        result[key] = value === "dep_group" ? "depGroup" : value;
      }
    }
    return result;
  }
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
function deepCamelizeTransaction(data: any): any {
  return deepCamelizeDepGroup(deepCamel(data));
}

export {
  CKBHasher,
  ckbHash,
  deepCamel,
  deepCamelizeTransaction,
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
