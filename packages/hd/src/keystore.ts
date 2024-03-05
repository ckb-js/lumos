import crypto from "crypto";
import { v4 as uuid } from "uuid";
import { ExtendedPrivateKey } from "./extended_key";
import { HexString } from "@ckb-lumos/base";
import { syncScrypt } from "scrypt-js";
import { bytifyWithout0x, hexifyWithout0x } from "./helper";
import { bytes } from "@ckb-lumos/codec";
import { keccak_256 } from "js-sha3";

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

  /**
   * @deprecated
   * Load keystore file from path.
   *
   * @param path
   */
  static load(path: string): Keystore {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    const json = fs.readFileSync(path, "utf-8");
    return this.fromJson(json);
  }

  /**
   * @deprecated
   * Keystore file default name is `${id}.json`.
   *
   * @param dir
   * @param options If you are sure to overwrite existing keystore file, set `overwrite` to true.
   */
  save(
    dir: string,
    {
      name = this.filename(),
      overwrite = false,
    }: { name?: string; overwrite?: boolean } = {}
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Path = require("path");
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
    const salt = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: hexifyWithout0x(salt),
      n: 2 ** 18,
      r: 8,
      p: 1,
    };
    return new Keystore(
      {
        ciphertext: "",
        cipherparams: {
          iv: hexifyWithout0x(iv),
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
    const salt: Uint8Array = options.salt || crypto.randomBytes(32);
    const iv: Uint8Array = options.iv || crypto.randomBytes(16);
    const kdfparams: KdfParams = {
      dklen: 32,
      salt: hexifyWithout0x(salt),
      n: 2 ** 18,
      r: 8,
      p: 1,
    };
    const derivedKey: Uint8Array = syncScrypt(
      new TextEncoder().encode(password),
      salt,
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen
    );

    const cipher: crypto.Cipher = crypto.createCipheriv(
      CIPHER,
      derivedKey.slice(0, 16),
      iv
    );
    if (!cipher) {
      throw new UnsupportedCipher();
    }
    const ciphertext: Uint8Array = bytes.concat(
      cipher.update(bytes.bytify(extendedPrivateKey.serialize())),
      cipher.final()
    );

    return new Keystore(
      {
        ciphertext: hexifyWithout0x(ciphertext),
        cipherparams: {
          iv: hexifyWithout0x(iv),
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
    const ciphertext = bytifyWithout0x(this.crypto.ciphertext);
    if (Keystore.mac(derivedKey, ciphertext) !== this.crypto.mac) {
      throw new IncorrectPassword();
    }
    const decipher = crypto.createDecipheriv(
      this.crypto.cipher,
      derivedKey.slice(0, 16),
      bytifyWithout0x(this.crypto.cipherparams.iv)
    );
    return bytes.hexify(
      bytes.concat(decipher.update(ciphertext), decipher.final())
    );
  }

  extendedPrivateKey(password: string): ExtendedPrivateKey {
    return ExtendedPrivateKey.parse(this.decrypt(password));
  }

  checkPassword(password: string): boolean {
    const derivedKey = this.derivedKey(password);
    const ciphertext = bytifyWithout0x(this.crypto.ciphertext);
    return Keystore.mac(derivedKey, ciphertext) === this.crypto.mac;
  }

  derivedKey(password: string): Uint8Array {
    const { kdfparams } = this.crypto;
    return syncScrypt(
      Buffer.from(password),
      Buffer.from(kdfparams.salt, "hex"),
      kdfparams.n,
      kdfparams.r,
      kdfparams.p,
      kdfparams.dklen
    );
  }

  static mac(
    derivedKey: Uint8Array,
    ciphertext: Uint8Array
  ): HexStringWithoutPrefix {
    const digest = keccak_256
      .create()
      .update(bytes.concat(derivedKey.slice(16, 32), ciphertext))
      .digest();

    return hexifyWithout0x(digest);
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
