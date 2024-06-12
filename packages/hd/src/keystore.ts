import { v4 as uuid } from "uuid";
import { bytes } from "@ckb-lumos/codec";
import { HexString } from "@ckb-lumos/base";
import { ctr, scrypt, keccak256, randomBytes } from "@ckb-lumos/crypto";
import { ExtendedPrivateKey } from "./extended_key";

const { bytify, concat, hexify } = bytes;

export type HexStringWithoutPrefix = string;

export class UnsupportedCipher extends Error {
  constructor() {
    super("Unsupported cipher!");
  }
}

export class IncorrectPassword extends Error {
  constructor() {
    super("Incorrect password!");
  }
}

export class InvalidKeystore extends Error {
  constructor() {
    super("Invalid keystore, please check your file integrity.");
  }
}

const CIPHER = "aes-128-ctr";
const CKB_CLI_ORIGIN = "ckb-cli";

type CipherParams = {
  iv: HexStringWithoutPrefix;
};

type KdfParams = {
  dklen: number;
  n: number;
  r: number;
  p: number;
  salt: HexStringWithoutPrefix;
};

type Crypto = {
  cipher: string;
  cipherparams: CipherParams;
  ciphertext: HexStringWithoutPrefix;
  kdf: string;
  kdfparams: KdfParams;
  mac: HexStringWithoutPrefix;
};

type ScryptOptions = {
  N: number;
  r: number;
  p: number;
  maxmem: number;
};

// The parameter r ("blockSize")
//    specifies the block size.
const DEFAULT_SCRIPT_PARAM_r = 8;
// The parallelization parameter p
//    ("parallelizationParameter") is a positive integer less than or equal
//    to ((2^32-1) * 32) / (128 * r)
const DEFAULT_SCRIPT_PARAM_p = 1;
// The CPU/Memory cost parameter N
//    ("costParameter") must be larger than 1, a power of 2, and less than
//    2^(128 * r / 8)
const DEFAULT_SCRYPT_PARAM_N = 262144;

// Encrypt and save master extended private key.
export default class Keystore {
  crypto: Crypto;
  id: string;
  version = 3;
  origin: string | undefined;

  constructor(theCrypto: Crypto, id: string, origin?: string) {
    this.crypto = theCrypto;
    this.id = id;
    this.origin = origin;
  }

  static fromJson(json: string): Keystore {
    try {
      const object = JSON.parse(json);
      return new Keystore(object.crypto, object.id, object.origin);
    } catch {
      throw new InvalidKeystore();
    }
  }

  toJson(): string {
    return JSON.stringify(this);
  }

  isFromCkbCli(): boolean {
    return this.origin === CKB_CLI_ORIGIN;
  }

  // Create an empty keystore object that contains empty private key
  static createEmpty(): Keystore {
    const saltSize = 32;
    const salt: Uint8Array = randomBytes(saltSize);
    const iv: Uint8Array = randomBytes(16);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: hexify(salt).slice(2),
      n: DEFAULT_SCRYPT_PARAM_N,
      r: DEFAULT_SCRIPT_PARAM_r,
      p: DEFAULT_SCRIPT_PARAM_p,
    };
    return new Keystore(
      {
        ciphertext: "",
        cipherparams: {
          iv: hexify(iv).slice(2),
        },
        cipher: CIPHER,
        kdf: "scrypt",
        kdfparams,
        mac: "",
      },
      uuid()
    );
  }

  static create(
    extendedPrivateKey: ExtendedPrivateKey,
    password: string,
    options: { salt?: Uint8Array; iv?: Uint8Array } = {}
  ): Keystore {
    const saltSize = 32;
    const ivSize = 16;
    const salt: Uint8Array = options.salt || randomBytes(saltSize);
    const iv: Uint8Array = options.iv || randomBytes(ivSize);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: hexify(salt).slice(2),
      n: DEFAULT_SCRYPT_PARAM_N,
      r: DEFAULT_SCRIPT_PARAM_r,
      p: DEFAULT_SCRIPT_PARAM_p,
    };
    const derivedKey = scrypt(new TextEncoder().encode(password), salt, {
      N: kdfparams.n,
      r: kdfparams.r,
      p: kdfparams.p,
      dkLen: kdfparams.dklen,
    });

    // DO NOT remove the Uint8Array.from call below.
    // Without calling Uint8Array.from to make a copy of iv,
    // iv will be set to 0000...00000 after calling cipher.encrypt(plaintext)
    // and decrypting the ciphertext will fail
    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
    const cipher = ctr(derivedKey.slice(0, 16), Uint8Array.from(iv));
    const plaintext = bytify(extendedPrivateKey.serialize());
    const ciphertext = cipher.encrypt(plaintext);

    return new Keystore(
      {
        ciphertext: hexify(ciphertext).slice(2),
        cipherparams: {
          iv: hexify(iv).slice(2),
        },
        cipher: CIPHER,
        kdf: "scrypt",
        kdfparams,
        mac: Keystore.mac(derivedKey, ciphertext),
      },
      uuid()
    );
  }

  // Imported from xpub with empty private key.
  isEmpty(): boolean {
    return this.crypto.ciphertext === "" && this.crypto.mac === "";
  }

  // Decrypt and return serialized extended private key.
  decrypt(password: string): HexString {
    const derivedKey = this.derivedKey(password);
    const ciphertext = bytify("0x" + this.crypto.ciphertext);
    if (Keystore.mac(derivedKey, ciphertext) !== this.crypto.mac) {
      throw new IncorrectPassword();
    }

    /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
    const cipher = ctr(
      derivedKey.slice(0, 16),
      bytify("0x" + this.crypto.cipherparams.iv)
    );
    return hexify(cipher.decrypt(ciphertext));
  }

  extendedPrivateKey(password: string): ExtendedPrivateKey {
    return ExtendedPrivateKey.parse(this.decrypt(password));
  }

  checkPassword(password: string): boolean {
    const derivedKey = this.derivedKey(password);
    const ciphertext = bytify("0x" + this.crypto.ciphertext);
    return Keystore.mac(derivedKey, ciphertext) === this.crypto.mac;
  }

  derivedKey(password: string): Uint8Array {
    const { kdfparams } = this.crypto;
    return scrypt(
      new TextEncoder().encode(password),
      bytify("0x" + kdfparams.salt),
      {
        N: kdfparams.n,
        r: kdfparams.r,
        p: kdfparams.p,
        dkLen: kdfparams.dklen,
      }
    );
  }

  static mac(
    derivedKey: Uint8Array,
    ciphertext: Uint8Array
  ): HexStringWithoutPrefix {
    // https://github.com/ethereumjs/ethereumjs-wallet/blob/d57582443fbac2b63956e6d5c4193aa8ce925b3d/src/index.ts#L615-L617
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const hash = keccak256(concat(derivedKey.subarray(16, 32), ciphertext));
    return hexify(hash).slice(2);
  }

  static scryptOptions(kdfparams: KdfParams): ScryptOptions {
    return {
      N: kdfparams.n,
      r: kdfparams.r,
      p: kdfparams.p,
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      maxmem: 128 * (kdfparams.n + kdfparams.p + 2) * kdfparams.r,
    };
  }
}
