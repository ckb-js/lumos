import { Reader } from "ckb-js-toolkit";
import { Script } from "./api";
import { Hash, HexString, JSBI } from "./primitive";

export class CKBHasher {
  update(data: string | Reader | ArrayBuffer): this;

  digestReader(): Reader;

  digestHex(): Hash;
}

export function ckbHash(buffer: ArrayBuffer): Reader;

/**
 * convert JSBI to BigUInt64 little-endian hex string
 *
 * @param num
 */
export function toBigUInt64LE(num: JSBI): HexString;

/**
 * convert BigUInt64 little-endian hex string to JSBI
 *
 * @param hex BigUInt64 little-endian hex string
 */
export function readBigUInt64LE(hex: HexString): JSBI;

/**
 * convert JSBI to BigUInt128 little-endian hex string
 *
 * @param u128
 */
export function toBigUInt128LE(u128: JSBI): string;

/**
 * convert BigUInt64 little-endian hex string to bigint
 *
 * @param leHex BigUInt128 little-endian hex string
 */
export function readBigUInt128LE(leHex: HexString): JSBI;

/**
 * compute lock/type hash
 *
 * @param script
 * @param options
 */
export function computeScriptHash(
  script: Script,
  options?: { validate?: boolean }
): Hash;

export function hashCode(buffer: Buffer): number;

export function assertHexString(debugPath: string, str: string): void;

export function assertHexadecimal(debugPath: string, str: string): void;

export function isDeepEqual(a: unknown, b: unknown): boolean;
