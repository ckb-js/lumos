import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";
import { AdjustedSkeleton, AuthByP2PKH, AuthPart, SigningHint } from "../types";
import { OmnilockWitnessLock } from "../codecs/witnesses";
import { LockArgsCodec } from "../codecs/args";
import { core, Script } from "@ckb-lumos/base";

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
  const scripts: Script[] = options.hints.map((hint) => {
    const { CODE_HASH, HASH_TYPE } = options.config;
    return {
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
  });
  const witnessPlaceholder = hexify(
    core.SerializeWitnessArgs({
      lock: OmnilockWitnessLock.pack({ signature: `0x${"00".repeat(65)}` })
        .buffer,
    })
  );
  let adjustedSkeleton = txSkeleton;
  const inputCount = txSkeleton.get("inputs").size;
  console.log("input count:", inputCount);
  console.log("inputs:", JSON.stringify(txSkeleton.get("inputs").toJS()));

  for (let index = 0; index < inputCount; index++) {
    adjustedSkeleton = adjustedSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(index, witnessPlaceholder)
    );
  }
  console.log(
    "before p2pkh create message group",
    adjustedSkeleton.get("witnesses").toJS()
  );
  const groups = createP2PKHMessageGroup(adjustedSkeleton, scripts);
  for (let index = 0; index < inputCount; index++) {
    adjustedSkeleton = adjustedSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(index, "0x")
    );
  }
  groups.forEach((group) => {
    if (!txSkeleton.witnesses.get(group.index)) {
      // initilize witness with placeholder if not exist
      adjustedSkeleton = adjustedSkeleton.update("witnesses", (witnesses) =>
        witnesses.set(group.index, witnessPlaceholder)
      );
    }
  });
  const signingHints: SigningHint[] = groups.map((group) => {
    return {
      script: group.lock,
      index: group.index,
      witnessArgItem: witnessPlaceholder,
      signatureOffset: 0,
      signatureLength: 65,
    };
  });
  console.log("p2pkh adjusted:", adjustedSkeleton.get("witnesses").toJS());

  return {
    adjusted: adjustedSkeleton,
    signingHints,
  };
}
