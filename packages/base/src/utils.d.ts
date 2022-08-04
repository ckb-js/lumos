import { HexNumber } from "..";
import { Script, Input } from "./api";
import { Hash } from "./primitive";

export class CKBHasher {
  update(data: string | ArrayBuffer): this;

  digestHex(): Hash;
}

export function ckbHash(buffer: ArrayBuffer): Hash;

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