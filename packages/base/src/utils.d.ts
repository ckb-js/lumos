import { BI, BIish } from "@ckb-lumos/bi";
import { Script, Input } from "./api";
import { Hash, HexNumber, HexString } from "./primitive";
import { BytesLike } from "@ckb-lumos/codec";

export class CKBHasher {
  update(data: string | ArrayBuffer): this;

  digestHex(): Hash;
}

export function ckbHash(data: BytesLike): Hash;

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 * convert bigint to BigUInt64 little-endian hex string
 * @param num
 */
export function toBigUInt64LE(num: BIish): HexString;

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 * convert BigUInt64 little-endian hex string to bigint
 *
 * @param hex BigUInt64 little-endian hex string
 */
export function readBigUInt64LE(hex: HexString): bigint;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function readBigUInt64LECompatible(hex: HexString): BI;

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 * convert bigint to BigUInt128 little-endian hex string
 *
 * @param u128
 */
export function toBigUInt128LE(u128: BIish): string;

/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 * convert BigUInt64 little-endian hex string to bigint
 *
 * @param leHex BigUInt128 little-endian hex string
 */
export function readBigUInt128LE(leHex: HexString): bigint;
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide} 
 */
export function readBigUInt128LECompatible(leHex: HexString): BI;

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
export function generateTypeIdScript(
  input: Input,
  outputIndex?: HexNumber
): Script;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function deepCamel(data: any): any;
export function deepCamelizeTransaction(data: any): any;
/* eslint-enable @typescript-eslint/no-explicit-any*/
