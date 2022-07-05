import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { AdjustedSkeleton, AuthByP2PKH, AuthPart, SigningInfo } from "../types";
import { OmnilockWitnessLock } from "../codecs/witnesses";
import { LockArgsCodec } from "../codecs/args";
import { core, Script } from "@ckb-lumos/base";
import { groupInputs } from "../utils";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";
import { Reader } from "@ckb-lumos/toolkit";

export function isP2PKHHint(x: AuthPart): x is AuthByP2PKH {
  return (
    x &&
    typeof x === "object" &&
    (x.authFlag === "ETHEREUM" || x.authFlag === "SECP256K1_BLAKE160")
  );
}

export function p2pkh(
  txSkeleton: TransactionSkeletonType,
  options: { config: ScriptConfig; hints: AuthByP2PKH[] }
): AdjustedSkeleton {
  const signingEntries: Array<SigningInfo> = [];
  // key is script hash, value is Script
  const scriptMap = new Map<string, Script>();
  // key is script hash, value is AuthPart
  const authMap = new Map<string, AuthPart>();
  const scripts: Script[] = options.hints.map((hint) => {
    const { CODE_HASH, HASH_TYPE } = options.config;
    const script: Script = {
      code_hash: CODE_HASH,
      hash_type: HASH_TYPE,
      args: hexify(
        LockArgsCodec.pack({
          authFlag: hint.authFlag,
          authContent: hint.options.pubkeyHash,
          omnilockArgs: {},
          omnilockFlags: {},
        })
      ),
    };
    scriptMap.set(computeScriptHash(script), script);
    authMap.set(computeScriptHash(script), hint);
    return script;
  });

  const witnessPlaceholder = hexify(
    core.SerializeWitnessArgs({
      lock: new Reader(
        `0x${"00".repeat(
          OmnilockWitnessLock.pack({ signature: `0x${"00".repeat(65)}` })
            .byteLength
        )}`
      ),
    })
  );
  const scriptGroupMap = groupInputs(txSkeleton.inputs.toArray(), scripts);
  for (const record of scriptGroupMap) {
    const [_, cellIndexes] = record;
    for (let index = 0; index < cellIndexes.length; index++) {
      const cellIndex = cellIndexes[index];
      if (index === 0) {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(cellIndex, witnessPlaceholder)
        );
      } else {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(cellIndex, "0x")
        );
      }
    }
  }

  const messageGroups = createP2PKHMessageGroup(txSkeleton, scripts);
  messageGroups.forEach((messageGroup) => {
    signingEntries.push({
      script: messageGroup.lock,
      index: messageGroup.index,
      witnessArgItem: witnessPlaceholder,
      signatureOffset: 0,
      signatureLength: 65,
      message: messageGroup.message,
      authHint: authMap.get(computeScriptHash(messageGroup.lock))!,
    });
  });

  return { adjusted: txSkeleton, signingEntries };
}
