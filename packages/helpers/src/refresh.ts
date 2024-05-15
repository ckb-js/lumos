import { TransactionSkeletonType } from "./";
import type { ResolveLatestOutPointsOfTypeIds } from "@ckb-lumos/config-manager/lib/refresh";

/**
 * Refresh cellDeps of txSkeleton
 * @example
 * const resolve = createRpcResolver(rpc)
 * // refresh the cell deps
 * let txSkeleton = await refreshTypeIdCellDeps(txSkeleton,  { resolve })
 * @param txSkeleton
 * @param resolve
 */
export async function refreshTypeIdCellDeps(
  txSkeleton: TransactionSkeletonType,
  { resolve }: { resolve: ResolveLatestOutPointsOfTypeIds }
): Promise<TransactionSkeletonType> {
  const outPoints = txSkeleton.cellDeps
    .map(({ outPoint }) => outPoint)
    .toArray();

  const latestOutPoints = await resolve(outPoints);

  return txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.map((cellDep, i) => ({ ...cellDep, outPoint: latestOutPoints[i] }))
  );
}
