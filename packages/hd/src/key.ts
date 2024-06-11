/* eslint-disable @typescript-eslint/no-magic-numbers */
import { bytes } from "@ckb-lumos/codec";
import { HexString, utils } from "@ckb-lumos/base";
import { ec as EC, SignatureInput } from "elliptic";
import { assertPrivateKey, assertPublicKey } from "./helper";

const { bytify } = bytes;
const ec = new EC("secp256k1");

export function signRecoverable(
  message: HexString,
  privateKey: HexString
): HexString {
  utils.assertHexString("message", message);
  assertPrivateKey(privateKey);

  const key = ec.keyFromPrivate(privateKey.slice(2));
  const { r, s, recoveryParam } = key.sign(message.slice(2), {
    canonical: true,
  });
  if (recoveryParam === null) {
    throw new Error("Sign message failed!");
  }
  const fmtR = r.toString(16).padStart(64, "0");
  const fmtS = s.toString(16).padStart(64, "0");
  const fmtRecoverableParam = recoveryParam.toString(16).padStart(2, "0");
  return "0x" + fmtR + fmtS + fmtRecoverableParam;
}

export function recoverFromSignature(
  message: HexString,
  signature: HexString
): HexString {
  utils.assertHexString("message", message);
  utils.assertHexString("signature", signature);

  const msg = bytify(message);
  const sig = bytify(signature);

  const sign: SignatureInput = {
    r: sig.slice(0, 32),
    s: sig.slice(32, 64),
    recoveryParam: sig[64],
  };

  const point = ec.recoverPubKey(msg, sign, sign.recoveryParam!);
  const publicKey = "0x" + point.encode("hex", true).toLowerCase();
  return publicKey;
}

export function privateToPublic(privateKey: HexString): HexString;
export function privateToPublic(privateKey: Uint8Array): Uint8Array;

export function privateToPublic(
  privateKey: Uint8Array | HexString
): Uint8Array | HexString {
  let pk = privateKey;
  if (typeof privateKey === "string") {
    assertPrivateKey(privateKey);
    pk = bytify(privateKey);
  }
  if (pk.length !== 32) {
    throw new Error("Private key must be 32 bytes!");
  }

  const publickey = "0x" + ec.keyFromPrivate(pk).getPublic(true, "hex");
  if (typeof privateKey === "string") {
    return publickey;
  }
  return bytify(publickey);
}

export function publicKeyToBlake160(publicKey: HexString): HexString {
  assertPublicKey(publicKey);

  const blake160: string = new utils.CKBHasher()
    .update(publicKey)
    .digestHex()
    .slice(0, 42);

  return blake160;
}

export function privateKeyToBlake160(privateKey: HexString): HexString {
  const publicKey: HexString = privateToPublic(privateKey);
  return publicKeyToBlake160(publicKey);
}

export default {
  signRecoverable,
  recoverFromSignature,
  privateToPublic,
  publicKeyToBlake160,
  privateKeyToBlake160,
};
