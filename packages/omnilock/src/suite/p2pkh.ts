import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";
import { AdjustedSkeleton, AuthByP2PKH, AuthPart, SigningHint } from "../types";
import { OmnilockWitnessLock } from "../codecs/witnesses";
import { LockArgsCodec } from "../codecs/args";
import { Script } from "@ckb-lumos/base";

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
    OmnilockWitnessLock.pack({ signature: `0x${"00".repeat(65)}` })
  );
  const groups = createP2PKHMessageGroup(txSkeleton, scripts);
  let adjustedSkeon = txSkeleton;
  groups.forEach((group) => {
    if (!txSkeleton.witnesses.get(group.index)) {
      // initilize witness with placeholder if not exist
      adjustedSkeon = txSkeleton.update("witnesses", (witnesses) =>
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
  return {
    adjusted: adjustedSkeon,
    signingHints,
  };
}
