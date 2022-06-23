import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { AdjustedSkeleton, AuthByP2PKH, AuthPart } from "../types";
import { OmnilockWitnessLock } from "../codecs/witnesses";
import { LockArgsCodec } from "../codecs/args";
import { core, Script } from "@ckb-lumos/base";
import { toolkit } from "@ckb-lumos/lumos";
import { groupInputs } from "../utils";

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
      lock: new toolkit.Reader(
        `0x${"00".repeat(
          OmnilockWitnessLock.pack({ signature: `0x${"00".repeat(65)}` })
            .byteLength
        )}`
      ),
    })
  );
  const scriptGroupMap = groupInputs(txSkeleton.inputs.toArray(), scripts);
  for (const record of scriptGroupMap) {
    const [_, scriptIndexes] = record;
    for (let index = 0; index < scriptIndexes.length; index++) {
      const currentScriptIndex = scriptIndexes[index];
      if (index === 0) {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(currentScriptIndex, witnessPlaceholder)
        );
      } else {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.set(currentScriptIndex, "0x")
        );
      }
    }
  }
  return txSkeleton;
}
