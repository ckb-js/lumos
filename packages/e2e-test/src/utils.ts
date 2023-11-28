import { Script } from "@ckb-lumos/base";
import { encodeToAddress } from "@ckb-lumos/helpers";
import { randomBytes } from "crypto";
import { key } from "@ckb-lumos/hd";
import { getConfig } from "@ckb-lumos/config-manager";
import { bytes } from "@ckb-lumos/codec";

const hexify = bytes.hexify;

// secp256k1 private key is 32-bytes length
export const generateRandomPrivateKey = (): string => hexify(randomBytes(32));

export function asyncSleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface Account {
  lockScript: Script;
  address: string;
  pubKey: string;
  privKey: string;
}

export const randomSecp256k1Account = (privKey?: string): Account => {
  const _privKey = (() => {
    if (privKey) {
      return privKey;
    }

    return generateRandomPrivateKey();
  })();

  const pubKey = key.privateToPublic(_privKey);
  const args = key.publicKeyToBlake160(pubKey);
  const template = getConfig().SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };

  const address = encodeToAddress(lockScript);

  return {
    lockScript,
    address,
    pubKey,
    privKey: _privKey,
  };
};
