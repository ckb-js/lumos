import { Script } from "./api";

export class CKBHasher {
    hasher: any;
    update(data: any): CKBHasher;
    digestHex(): string;
}
export function ckbHash(buffer: any): string;
export function toBigUInt64LE(num: any): string;
export function toBigUInt64LECompatible(num: any): string;
export function readBigUInt64LE(hex: any): bigint;
export function readBigUInt64LECompatible(hex: any): import("@ckb-lumos/bi").BI;
export function toBigUInt128LE(u128: any): string;
export function toBigUInt128LECompatible(num: any): string;
export function readBigUInt128LE(leHex: any): bigint;
export function readBigUInt128LECompatible(leHex: any): import("@ckb-lumos/bi").BI;
export function computeScriptHash(script: any): string;
export function hashCode(buffer: any): number;
export function assertHexString(debugPath: any, str: any): void;
export function assertHexadecimal(debugPath: any, str: any): void;
export function isDeepEqual(a: any, b: any): boolean;
export function generateTypeIdScript(input: any, outputIndex?: string): Script;
export function deepCamel(data: any): any;
export function deepCamelizeDepType(data: any): any;
