// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./third.d.ts" />
import { hmac } from "@noble/hashes/hmac";
import { sha512 } from "@noble/hashes/sha512";
import { sha256 } from "@noble/hashes/sha256";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { scrypt } from "@noble/hashes/scrypt";
import { randomBytes as _randomBytes } from "@noble/hashes/utils";
import { pbkdf2 as _pbkdf2 } from "@noble/hashes/pbkdf2";
import type { Hash, HashAlgo, ScryptOptions } from "./types";
// TODO may replace with the crypto.subtle API
import {
  createCipheriv as _createCipheriv,
  createDecipheriv as _createDecipheriv,
} from "browserify-aes";
import { Cipher } from "./types";

function _createHash(algorithm: HashAlgo) {
  if (algorithm === "sha512") return sha512;
  if (algorithm === "sha256") return sha256;
  if (algorithm === "ripemd160") return ripemd160;
  throw new Error(`Unknown hash algorithm ${algorithm}`);
}

export function createHash(algorithm: HashAlgo): Hash {
  return _createHash(algorithm).create();
}

export function createHmac(algorithm: HashAlgo, key: Uint8Array): Hash {
  return hmac.create(_createHash(algorithm), key);
}

export function scryptSync(
  password: Uint8Array,
  salt: Uint8Array,
  dkLen: number,
  options: ScryptOptions
): Uint8Array {
  return scrypt(password, salt, {
    dkLen,
    r: options.r,
    p: options.p,
    N: options.N,
  });
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
  return _pbkdf2(_createHash(digest), password, salt, {
    dkLen: keyLen,
    c: iterations,
  });
}
