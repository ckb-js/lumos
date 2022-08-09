import {
  PackedSince,
  Hash,
  Address,
  Script,
  HexString,
  utils,
} from "@ckb-lumos/base";
import { Options, parseAddress } from "@ckb-lumos/helpers";
import { getConfig } from "@ckb-lumos/config-manager";
import { bytes, number } from "@ckb-lumos/codec";

const { CKBHasher } = utils;

/**
 * secp256k1_blake160_multisig script requires S, R, M, N and public key hashes
 * S must be zero now
 * and N equals to publicKeyHashes size
 * so only need to provide R, M and public key hashes
 */
export interface MultisigScript {
  /** first nth public keys must match, 1 byte */
  R: number;
  /** threshold, 1 byte */
  M: number;
  /** blake160 hashes of compressed public keys */
  publicKeyHashes: Hash[];
  /** locktime in since format */
  since?: PackedSince;
}

export interface ACP {
  address: Address;
  destroyable?: boolean; // default to false
}

export interface CustomScript {
  script: Script;
  customData: HexString;
}

export type FromInfo = MultisigScript | Address | ACP | CustomScript;

/**
 *
 * @param params multisig script params
 * @returns serialized multisig script
 */
export function serializeMultisigScript({
  R,
  M,
  publicKeyHashes,
}: MultisigScript): HexString {
  if (R < 0 || R > 255) {
    throw new Error("`R` should be less than 256!");
  }
  if (M < 0 || M > 255) {
    throw new Error("`M` should be less than 256!");
  }
  // TODO: validate publicKeyHashes
  return (
    "0x00" +
    ("00" + R.toString(16)).slice(-2) +
    ("00" + M.toString(16)).slice(-2) +
    ("00" + publicKeyHashes.length.toString(16)).slice(-2) +
    publicKeyHashes.map((h) => h.slice(2)).join("")
  );
}

/**
 *
 * @param serializedMultisigScript
 * @param since
 * @returns lock script args
 */
export function multisigArgs(
  serializedMultisigScript: HexString,
  since?: PackedSince
): HexString {
  let sinceLE = "0x";
  if (since != null) {
    sinceLE = bytes.hexify(number.Uint64LE.pack(since));
  }
  return (
    new CKBHasher().update(serializedMultisigScript).digestHex().slice(0, 42) +
    sinceLE.slice(2)
  );
}

export function parseFromInfo(
  fromInfo: FromInfo,
  { config = undefined }: Options = {}
): {
  fromScript: Script;
  multisigScript?: HexString;
  destroyable?: boolean;
  customData?: HexString;
} {
  config = config || getConfig();

  let fromScript: Script | undefined;
  let multisigScript: HexString | undefined;
  let destroyable: boolean | undefined;
  let customData: HexString | undefined;

  if (typeof fromInfo === "string") {
    // fromInfo is an address
    fromScript = parseAddress(fromInfo, { config });
  } else {
    if ("R" in fromInfo) {
      const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
      if (!template) {
        throw new Error(
          "Provided config does not have SECP256K1_BLAKE16_MULTISIG script setup!"
        );
      }

      multisigScript = serializeMultisigScript(fromInfo);
      const fromScriptArgs = multisigArgs(multisigScript, fromInfo.since);
      fromScript = {
        codeHash: template.CODE_HASH,
        hashType: template.HASH_TYPE,
        args: fromScriptArgs,
      };
    } else if ("address" in fromInfo) {
      const template = config.SCRIPTS.ANYONE_CAN_PAY;
      if (!template) {
        throw new Error(
          "Provided config does not have ANYONE_CAN_PAY script setup!"
        );
      }

      const address = fromInfo.address;
      fromScript = parseAddress(address, { config });
      destroyable = fromInfo.destroyable;

      if (
        fromScript.codeHash !== template.CODE_HASH ||
        fromScript.hashType !== template.HASH_TYPE
      ) {
        throw new Error(`fromInfo.address is not ANYONE_CAN_PAY address!`);
      }
    } else if ("script" in fromInfo) {
      fromScript = fromInfo.script;
      customData = fromInfo.customData;
    } else {
      throw new Error("Invalid fromInfo format!");
    }
  }

  return {
    fromScript,
    multisigScript,
    destroyable,
    customData,
  };
}
