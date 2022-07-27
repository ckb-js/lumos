import crypto from "crypto";
import { Keccak } from "sha3";
import { v4 as uuid } from "uuid";
import fs from "fs";
import Path from "path";

import { ExtendedPrivateKey } from "./extended_key";
import { HexString } from "@ckb-lumos/base";

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

// Encrypt and save master extended private key.
export default class Keystore {
  crypto: Crypto;
  id: string;
  version: number = 3;
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

  /**
   * Load keystore file from path.
   *
   * @param path
   */
  static load(path: string): Keystore {
    const json = fs.readFileSync(path, "utf-8");
    return this.fromJson(json);
  }

  /**
   * Keystore file default name is `${id}.json`.
   *
   * @param dir
   * @param options If you are sure to overwrite existing keystore file, set `overwrite` to true.
   */
  save(
    dir: string,
    { name = this.filename(), overwrite = false }: { name?: string; overwrite?: boolean } = {}
  ): void {
    const path: string = Path.join(dir, name);
    if (!overwrite && fs.existsSync(path)) {
      throw new Error("Keystore file already exists!");
    }
    fs.writeFileSync(path, this.toJson());
  }

  private filename(): string {
    return this.id + ".json";
  }

  toJson(): string {
    return JSON.stringify(this);
  }

  isFromCkbCli(): boolean {
    return this.origin === CKB_CLI_ORIGIN;
  }

  // Create an empty keystore object that contains empty private key
  static createEmpty(): Keystore {
    const salt: Buffer = crypto.randomBytes(32);
    const iv: Buffer = crypto.randomBytes(16);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: salt.toString("hex"),
      n: 2 ** 18,
      r: 8,
      p: 1,
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
    const salt: Buffer = options.salt || crypto.randomBytes(32);
    const iv: Buffer = options.iv || crypto.randomBytes(16);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: salt.toString("hex"),
      n: 2 ** 18,
      r: 8,
      p: 1,
    };
    const derivedKey: Buffer = crypto.scryptSync(
      password,
      salt,
      kdfparams.dklen,
      Keystore.scryptOptions(kdfparams)
    );

    const cipher: crypto.Cipher = crypto.createCipheriv(CIPHER, derivedKey.slice(0, 16), iv);
    if (!cipher) {
      throw new UnsupportedCipher();
    }
    const ciphertext: Buffer = Buffer.concat([
      cipher.update(Buffer.from(extendedPrivateKey.serialize().slice(2), "hex")),
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
    return "0x" + Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("hex");
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
    return crypto.scryptSync(
      password,
      Buffer.from(kdfparams.salt, "hex"),
      kdfparams.dklen,
      Keystore.scryptOptions(kdfparams)
    );
  }

  static mac(derivedKey: Buffer, ciphertext: Buffer): HexStringWithoutPrefix {
    return new Keccak(256)
      .update(Buffer.concat([derivedKey.slice(16, 32), ciphertext]))
      .digest("hex");
  }

  static scryptOptions(kdfparams: KdfParams): crypto.ScryptOptions {
    return {
      N: kdfparams.n,
      r: kdfparams.r,
      p: kdfparams.p,
      maxmem: 128 * (kdfparams.n + kdfparams.p + 2) * kdfparams.r,
    };
  }
}
