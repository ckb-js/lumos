import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { AdjustedSkeleton, AuthByP2PKH, AuthPart } from "../types";
import { unimplemented } from "../utils";

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
  console.log(txSkeleton);
  console.log(options);
  unimplemented();
}
