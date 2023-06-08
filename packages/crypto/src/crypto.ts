import {
  createHmac as _createHmac,
  createHash as _createHash,
  scryptSync as _scryptSync,
  randomBytes as _randomBytes,
  createCipheriv as _createCipheriv,
  createDecipheriv as _createDecipheriv,
  pbkdf2Sync as _pbkdf2Sync,
} from "node:crypto";
import type { Cipher, Hash, HashAlgo } from "./types";

export function createHash(algorithm: HashAlgo): Hash {
  return _createHash(algorithm);
}

export function createHmac(algorithm: HashAlgo, key: Uint8Array): Hash {
  return _createHmac(algorithm, key);
}

export function randomBytes(bytesLen: number): Uint8Array {
  return _randomBytes(bytesLen);
}

export function createCipheriv(
  algorithm: string,
  key: Uint8Array,
  iv: Uint8Array
): Cipher {
  return _createCipheriv(algorithm, key, iv);
}

export function createDecipheriv(
  algorithm: string,
  key: Uint8Array,
  iv: Uint8Array
): Cipher {
  return _createDecipheriv(algorithm, key, iv);
}

export function pbkdf2Sync(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
  keyLen: number,
  digest: HashAlgo
): Uint8Array {
  return _pbkdf2Sync(password, salt, iterations, keyLen, digest);
}

export { scryptSync, scrypt } from "./scrypt";
