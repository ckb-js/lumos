import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { AdjustedSkeleton, AuthByMultiSig, AuthPart } from "../types";
import { unimplemented } from "../utils";

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

  unimplemented();
}
