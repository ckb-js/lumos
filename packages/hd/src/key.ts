import { HexString, utils } from "@ckb-lumos/base";
import { ec as EC, SignatureInput } from "elliptic";

const ec = new EC("secp256k1");

export function signRecoverable(
  message: HexString,
  privateKey: HexString
): HexString {
  utils.assertHexString("message", message);
  utils.assertHexString("privateKey", privateKey);

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

  const msgBuffer = Buffer.from(message.slice(2), "hex");
  const sigBuffer = Buffer.from(signature.slice(2), "hex");

  const sign: SignatureInput = {
    r: sigBuffer.slice(0, 32),
    s: sigBuffer.slice(32, 64),
    recoveryParam: sigBuffer[64],
  };

  const point = ec.recoverPubKey(msgBuffer, sign, sign.recoveryParam!);
  const publicKey = "0x" + point.encode("hex", true).toLowerCase();
  return publicKey;
}

export default {
  signRecoverable,
  recoverFromSignature,
};
