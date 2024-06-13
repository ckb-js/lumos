/* eslint-disable @typescript-eslint/no-magic-numbers */
import BN from "bn.js";
import { ec as EC } from "elliptic";
import { bytes } from "@ckb-lumos/codec";
import { Uint32BE } from "@ckb-lumos/codec/lib/number";
import { hmac, sha256, sha512, ripemd160 } from "@ckb-lumos/crypto";
import { privateToPublic } from "./key";

const { concat } = bytes;

const ec = new EC("secp256k1");

const EMPTY_BUFFER = Uint8Array.from([]);

// BIP32 Keychain. Not a full implementation.
export default class Keychain {
  privateKey: Uint8Array = EMPTY_BUFFER;
  publicKey: Uint8Array = EMPTY_BUFFER;
  chainCode: Uint8Array = EMPTY_BUFFER;
  index = 0;
  depth = 0;
  identifier: Uint8Array = EMPTY_BUFFER;
  fingerprint = 0;
  parentFingerprint = 0;

  constructor(privateKey: Uint8Array, chainCode: Uint8Array) {
    this.privateKey = privateKey;
    this.chainCode = chainCode;

    if (!this.isNeutered()) {
      this.publicKey = privateToPublic(this.privateKey);
    }
  }

  calculateFingerprint(): void {
    this.identifier = this.hash160(this.publicKey);
    this.fingerprint = Uint32BE.unpack(this.identifier.slice(0, 4));
  }

  public static fromSeed(seed: Uint8Array): Keychain {
    const i = hmac(sha512, new TextEncoder().encode("Bitcoin seed"), seed);
    const keychain = new Keychain(i.slice(0, 32), i.slice(32));
    keychain.calculateFingerprint();
    return keychain;
  }

  // Create a child keychain with extended public key and path.
  // Children of this keychain should not have any hardened paths.
  public static fromPublicKey(
    publicKey: Uint8Array,
    chainCode: Uint8Array,
    path: string
  ): Keychain {
    const keychain = new Keychain(EMPTY_BUFFER, chainCode);
    keychain.publicKey = publicKey;
    keychain.calculateFingerprint();

    const pathComponents = path.split("/");
    keychain.depth = pathComponents.length - 1;
    keychain.index = parseInt(pathComponents[pathComponents.length - 1], 10);

    return keychain;
  }

  public deriveChild(index: number, hardened: boolean): Keychain {
    let data: Uint8Array;

    const ui8a: Uint8Array = new Uint8Array(4);
    const view = new DataView(ui8a.buffer);

    if (hardened) {
      const pk = concat([0], this.privateKey);
      view.setUint32(0, index + 0x80000000);
      data = concat(pk, ui8a);
    } else {
      view.setUint32(0, index);
      data = concat(this.publicKey, ui8a);
    }

    const i = hmac(sha512, this.chainCode, data);
    const il = i.slice(0, 32);
    const ir = i.slice(32);

    let child: Keychain;
    if (this.isNeutered()) {
      child = new Keychain(EMPTY_BUFFER, ir);
      child.publicKey = Keychain.publicKeyAdd(this.publicKey, il);
      child.calculateFingerprint();
    } else {
      const privateKey = Keychain.privateKeyAdd(this.privateKey, il);
      child = new Keychain(privateKey, ir);
      child.calculateFingerprint();
    }

    child.index = index;
    child.depth = this.depth + 1;
    child.parentFingerprint = this.fingerprint;

    return child;
  }

  public derivePath(path: string): Keychain {
    const master = ["m", `/`, ""];
    if (master.includes(path)) {
      return this;
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let bip32: Keychain = this;

    let entries = path.split("/");
    if (entries[0] === "m") {
      entries = entries.slice(1);
    }
    entries.forEach((c) => {
      const childIndex = parseInt(c, 10);
      const hardened = c.length > 1 && c[c.length - 1] === "'";
      bip32 = bip32.deriveChild(childIndex, hardened);
    });

    return bip32;
  }

  isNeutered(): boolean {
    return this.privateKey === EMPTY_BUFFER;
  }

  hash160(data: Uint8Array): Uint8Array {
    return ripemd160(sha256(data));
  }

  private static privateKeyAdd(
    privateKey: Uint8Array,
    factor: Uint8Array
  ): Uint8Array {
    const result = new BN(factor);
    result.iadd(new BN(privateKey));
    if (result.cmp(ec.curve.n) >= 0) {
      result.isub(ec.curve.n);
    }

    return Uint8Array.from(result.toArray("be", 32));
  }

  private static publicKeyAdd(
    publicKey: Uint8Array,
    factor: Uint8Array
  ): Uint8Array {
    const x = new BN(publicKey.slice(1)).toRed(ec.curve.red);
    let y = x.redSqr().redIMul(x).redIAdd(ec.curve.b).redSqrt();
    if ((publicKey[0] === 0x03) !== y.isOdd()) {
      y = y.redNeg();
    }
    const point = ec.curve.g.mul(new BN(factor)).add({ x, y });
    return Uint8Array.from(point.encode(true, true));
  }
}
