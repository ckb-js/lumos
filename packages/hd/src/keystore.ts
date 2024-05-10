import crypto from "crypto";
import { Keccak } from "sha3";
import { v4 as uuid } from "uuid";
import { ExtendedPrivateKey } from "./extended_key";
import { HexString } from "@ckb-lumos/base";
import { syncScrypt } from "scrypt-js";

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

interface CipherParams {
  iv: HexStringWithoutPrefix;
}

interface KdfParams {
  dklen: number;
  n: number;
  r: number;
  p: number;
  salt: HexStringWithoutPrefix;
}

interface Crypto {
  cipher: string;
  cipherparams: CipherParams;
  ciphertext: HexStringWithoutPrefix;
  kdf: string;
  kdfparams: KdfParams;
  mac: HexStringWithoutPrefix;
}

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
    const salt: Buffer = crypto.randomBytes(saltSize);
    const iv: Buffer = crypto.randomBytes(16);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: salt.toString("hex"),
      n: DEFAULT_SCRYPT_PARAM_N,
      r: DEFAULT_SCRIPT_PARAM_r,
      p: DEFAULT_SCRIPT_PARAM_p,
    };
    return new Keystore(
      {
        ciphertext: "",
        cipherparams: {
          iv: iv.toString("hex"),
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
    options: { salt?: Buffer; iv?: Buffer } = {}
  ): Keystore {
    const saltSize = 32;
    const ivSize = 16;
    const salt: Buffer = options.salt || crypto.randomBytes(saltSize);
    const iv: Buffer = options.iv || crypto.randomBytes(ivSize);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: salt.toString("hex"),
      n: DEFAULT_SCRYPT_PARAM_N,
      r: DEFAULT_SCRIPT_PARAM_r,
      p: DEFAULT_SCRIPT_PARAM_p,
    };
    const derivedKey: Buffer = Buffer.from(
      syncScrypt(
        Buffer.from(password),
        salt,
        kdfparams.n,
        kdfparams.r,
        kdfparams.p,
        kdfparams.dklen
      )
    );

    const cipher: crypto.Cipher = crypto.createCipheriv(
      CIPHER,
      derivedKey.slice(0, 16),
      iv
    );
    if (!cipher) {
      throw new UnsupportedCipher();
    }

    // size of 0x prefix
    const hexPrefixSize = 2;
    const ciphertext: Buffer = Buffer.concat([
      cipher.update(
        Buffer.from(extendedPrivateKey.serialize().slice(hexPrefixSize), "hex")
      ),
      cipher.final(),
    ]);

    return new Keystore(
      {
        ciphertext: ciphertext.toString("hex"),
        cipherparams: {
          iv: iv.toString("hex"),
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
    const ciphertext = Buffer.from(this.crypto.ciphertext, "hex");
    if (Keystore.mac(derivedKey, ciphertext) !== this.crypto.mac) {
      throw new IncorrectPassword();
    }
    const decipher = crypto.createDecipheriv(
      this.crypto.cipher,
      derivedKey.slice(0, 16),
      Buffer.from(this.crypto.cipherparams.iv, "hex")
    );
    return (
      "0x" +
      Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        "hex"
      )
    );
  }

  extendedPrivateKey(password: string): ExtendedPrivateKey {
    return ExtendedPrivateKey.parse(this.decrypt(password));
  }

  checkPassword(password: string): boolean {
    const derivedKey = this.derivedKey(password);
    const ciphertext = Buffer.from(this.crypto.ciphertext, "hex");
    return Keystore.mac(derivedKey, ciphertext) === this.crypto.mac;
  }

  derivedKey(password: string): Buffer {
    const { kdfparams } = this.crypto;
    return Buffer.from(
      syncScrypt(
        Buffer.from(password),
        Buffer.from(kdfparams.salt, "hex"),
        kdfparams.n,
        kdfparams.r,
        kdfparams.p,
        kdfparams.dklen
      )
    );
  }

  static mac(derivedKey: Buffer, ciphertext: Buffer): HexStringWithoutPrefix {
    const keccakSize = 256;

    return (
      new Keccak(keccakSize)
        // https://github.com/ethereumjs/ethereumjs-wallet/blob/d57582443fbac2b63956e6d5c4193aa8ce925b3d/src/index.ts#L615-L617
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        .update(Buffer.concat([derivedKey.subarray(16, 32), ciphertext]))
        .digest("hex")
    );
  }

  static scryptOptions(kdfparams: KdfParams): crypto.ScryptOptions {
    return {
      N: kdfparams.n,
      r: kdfparams.r,
      p: kdfparams.p,
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      maxmem: 128 * (kdfparams.n + kdfparams.p + 2) * kdfparams.r,
    };
  }
}
