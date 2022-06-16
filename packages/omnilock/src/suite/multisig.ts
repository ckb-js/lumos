import { utils } from "@ckb-lumos/lumos";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import {
  AdjustedSkeleton,
  AuthByMultiSig,
  AuthPart,
  SigningHint,
} from "../types";
import { Hash, Script } from "@ckb-lumos/base";
import { CKBHasher } from "@ckb-lumos/base/lib/utils";
import { createP2PKHMessageGroup } from "@ckb-lumos/common-scripts";

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
  console.log(txSkeleton);
  console.log(options);
  const witnessPlaceholders: Record<Hash, Hash> = {};
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
    const script = {
      code_hash: CODE_HASH,
      hash_type: HASH_TYPE,
      args: new CKBHasher().update(multisigScript).digestHex().slice(0, 42),
    };
    witnessPlaceholders[
      utils.computeScriptHash(script)
    ] = `${multisigScript}${"00".repeat(65 * hint.options.M)}`;
    return script;
  });

  const groups = createP2PKHMessageGroup(txSkeleton, scripts);
  let adjustedSkeleton = txSkeleton;
  groups.forEach((group) => {
    if (!txSkeleton.witnesses.get(group.index)) {
      // initilize witness with placeholder if not exist
      adjustedSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.set(
          group.index,
          witnessPlaceholders[utils.computeScriptHash(group.lock)]
        )
      );
    }
  });
  const signingHints: SigningHint[] = groups.map((group) => {
    return {
      script: group.lock,
      index: group.index,
      witnessArgItem: witnessPlaceholders[utils.computeScriptHash(group.lock)],
      signatureOffset: 0,
      signatureLength: 65,
    };
  });
  return {
    adjusted: adjustedSkeleton,
    signingHints,
  };
}
