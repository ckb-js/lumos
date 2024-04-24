import {
  createTransactionFromSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { BuildingPacketV1 } from "./codec";
import { UnpackResult } from "@ckb-lumos/codec";

type BuildingPacketV1Type = UnpackResult<typeof BuildingPacketV1>;
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * create a BuildingPacketV1 from a TransactionSkeleton
 * @param txSkeleton
 * @param options
 */
export function createBuildingPacketV1(
  txSkeleton: TransactionSkeletonType,
  options: OptionalKeys<
    BuildingPacketV1Type,
    "resolvedInputs" | "payload" | "lockActions"
  >
): BuildingPacketV1Type {
  const resolvedInputs: BuildingPacketV1Type["resolvedInputs"] = (() => {
    if (options.resolvedInputs) {
      return options.resolvedInputs;
    }

    const result: BuildingPacketV1Type["resolvedInputs"] = {
      outputs: [],
      outputsData: [],
    };
    txSkeleton.get("inputs").forEach((cell) => {
      resolvedInputs.outputs.push(cell.cellOutput);
      resolvedInputs.outputsData.push(cell.data);
    });
    return result;
  })();

  return {
    message: options.message,
    scriptInfos: options.scriptInfos,
    lockActions: options.lockActions || [],
    resolvedInputs: resolvedInputs,
    payload: options.payload || createTransactionFromSkeleton(txSkeleton),
    changeOutput: options.changeOutput,
  };
}
