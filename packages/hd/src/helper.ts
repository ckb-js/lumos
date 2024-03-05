import { utils, HexString } from "@ckb-lumos/base";
import { BytesLike, bytes } from "@ckb-lumos/codec";
const { assertHexString } = utils;

export function assertPublicKey(
  publicKey: HexString,
  debugPath?: string
): void {
  debugPath = debugPath || "publicKey";
  assertHexString(debugPath, publicKey);
  if (publicKey.length !== 68) {
    throw new Error(`publicKey must be length of 33 bytes!`);
  }
}

export function assertPrivateKey(privateKey: HexString): void {
  assertHexString("privateKey", privateKey);
  if (privateKey.length !== 66) {
    throw new Error(`privateKey must be length of 32 bytes!`);
  }
}

export function assertChainCode(chainCode: HexString): void {
  assertHexString("chainCode", chainCode);
  if (chainCode.length !== 66) {
    throw new Error(`chainCode must be length of 32 bytes!`);
  }
}

export function hexifyWithout0x(value: BytesLike): string {
  return bytes.hexify(value).slice(2);
}

export function bytifyWithout0x(value: string): Uint8Array {
  return bytes.bytify("0x" + value);
}
