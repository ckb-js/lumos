import { utils, core, toolkit } from "@ckb-lumos/lumos";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { AdjustedSkeleton, AuthByMultiSig, AuthPart } from "../types";
import { Hash, Script } from "@ckb-lumos/base";
import { CKBHasher } from "@ckb-lumos/base/lib/utils";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";
import { bytify, hexify } from "@ckb-lumos/codec/lib/bytes";
import { groupInputs } from "../utils";
import { LockArgsCodec, OmnilockWitnessLock } from "../codecs";
import { predefined } from "@ckb-lumos/config-manager/src/predefined";

export function isMultisigHint(x: AuthPart): x is AuthByMultiSig {
  return x && typeof x === "object" && x.authFlag === "MULTISIG";
}

export function adjustMultisig(
  txSkeleton: TransactionSkeletonType,
  options: {
    config: ScriptConfig;
    hints: AuthByMultiSig[];
  }
): AdjustedSkeleton {
  console.log("adjust multisig:", options);

  const multisigScriptMap: Record<Hash, Hash> = {};
  const hintsMap: Record<Hash, AuthByMultiSig> = {};
  const scripts: Script[] = options.hints.map((hint) => {
    const { CODE_HASH, HASH_TYPE } = options.config;
    const r = Number(hint.options.R).toString(16).padStart(2, "0");
    const m = Number(hint.options.M).toString(16).padStart(2, "0");
    const n = Number(hint.options.publicKeyHashes.length)
      .toString(16)
      .padStart(2, "0");
    const multisigScript = `0x00${r}${m}${n}${hint.options.publicKeyHashes
      .map((hash) => hash.slice(2))
      .join("")}`;
    const multisigLock: Script = {
      code_hash:
        predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.CODE_HASH,
      hash_type:
        predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.HASH_TYPE,
      args: new CKBHasher().update(multisigScript).digestHex().slice(0, 42),
    };
    const script = {
      code_hash: CODE_HASH,
      hash_type: HASH_TYPE,
      args: hexify(
        LockArgsCodec.pack({
          authFlag: hint.authFlag,
          authContent: utils.computeScriptHash(multisigLock).slice(0, 42),
          omnilockArgs: {},
          omnilockFlags: {},
        })
      ),
    };
    multisigScriptMap[utils.computeScriptHash(script)] = multisigScript;
    hintsMap[utils.computeScriptHash(script)] = hint;
    return script;
  });
  console.log("adjust multisig multisigScriptMap:", multisigScriptMap);
  const scriptGroupMap = groupInputs(txSkeleton.inputs.toArray(), scripts);
  console.log("scriptGroupMap", scriptGroupMap);
  console.log(
    "scriptGroupMap",
    txSkeleton.inputs.toArray()[0].cell_output.lock,
    scripts
  );

  for (const record of scriptGroupMap) {
    const [scriptHash, scriptIndexes] = record;
    const currentMultisigScript = multisigScriptMap[scriptHash];
    const currntHint = hintsMap[scriptHash];
    const witnessPlaceholder = hexify(
      core.SerializeWitnessArgs({
        lock: new toolkit.Reader(
          OmnilockWitnessLock.pack({
            signature:
              currentMultisigScript + "00".repeat(65 * currntHint.options.M),
          })
        ),
      })
    );
    console.log("witnessPlaceholder", witnessPlaceholder);

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
  // const signingHints: SigningHint[] = groups.reduce((previousValue, group) => {
  //   const hint = hintsMap[utils.computeScriptHash(group.lock)];
  //   const multiScript = multisigScriptMap[utils.computeScriptHash(group.lock)];
  //   const m = hint.options.M;
  //   const currentHints: SigningHint[] = [];
  //   for (let nthHint = 0; nthHint < m; nthHint++) {
  //     currentHints.push({
  //       script: group.lock,
  //       index: group.index,
  //       witnessArgItem: multiScript + "00".repeat(65 * m),
  //       signatureOffset: 65 * nthHint + bytify(multiScript).byteLength,
  //       signatureLength: 65,
  //     });
  //   }
  //   previousValue.push(...currentHints);
  //   return previousValue;
  // }, [] as SigningHint[]);
  return txSkeleton;
}
