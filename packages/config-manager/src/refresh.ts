import type { Hash, OutPoint, Output, Script } from "@ckb-lumos/base";
import type { ScriptConfig, ScriptConfigs } from "./types";
import type { CKBComponents } from "@ckb-lumos/rpc/lib/types/api";

type MaybePromise<T> = T | PromiseLike<T>;

// prettier-ignore
/**
 * resolve the latest `OutPoint[]` that has consumed the old `OutPoint[]`
 */
export type ResolveLatestOutPointsOfTypeIds = (outPoints: OutPoint[]) => MaybePromise<OutPoint[]>;
// prettier-ignore
export type FetchOutputsByTxHashes = (txHashes: string[]) => MaybePromise<{ outputs: Output[] }[]>;
// prettier-ignore
/**
 * fetch cells with corresponding type script
 */
export type FetchOutPointByTypeId = (scripts: Script[]) => MaybePromise<{ outPoint: OutPoint }[]>;

// prettier-ignore
/**
 * the minimal batch RPC client
 */
export type BatchRequest = {
  createBatchRequest<Params, Result>(params: Params[]): { exec(): Promise<Result[]> };
};

export function createRpcResolver(
  rpc: BatchRequest
): ResolveLatestOutPointsOfTypeIds {
  const fetchTxs: FetchOutputsByTxHashes = async (txHashes) => {
    const txs = await rpc
      .createBatchRequest<
        ["getTransaction", Hash],
        CKBComponents.TransactionWithStatus
      >(txHashes.map((txHash) => ["getTransaction", txHash]))
      .exec();

    return zipWith(txHashes, txs, (txHash, tx) => {
      if (!tx?.transaction) {
        throw new Error(`Cannot find transaction ${txHash}`);
      }
      return tx.transaction;
    });
  };

  const fetchIndexerCells: FetchOutPointByTypeId = async (typeIds) => {
    const res = await rpc
      .createBatchRequest<unknown[], CKBComponents.GetLiveCellsResult<false>>(
        typeIds.map((typeId) => [
          "getCells",
          {
            script: typeId,
            scriptType: "type",
            scriptSearchMode: "exact",
            withData: false,
          } satisfies CKBComponents.GetCellsSearchKey<false>,
          "asc" satisfies CKBComponents.Order,
          "0x1" satisfies CKBComponents.UInt64,
        ])
      )
      .exec();

    return res.map((item) => item.objects[0]);
  };

  return createLatestTypeIdResolver(fetchTxs, fetchIndexerCells);
}

export function createLatestTypeIdResolver(
  fetchOutputs: FetchOutputsByTxHashes,
  fetchTypeScriptCell: FetchOutPointByTypeId
): ResolveLatestOutPointsOfTypeIds {
  return async (oldOutPoints) => {
    const txs = await fetchOutputs(
      oldOutPoints.map((outPoint) => outPoint.txHash)
    );

    const typeScripts = zipWith(oldOutPoints, txs, (outPoint, tx) => {
      nonNullable(outPoint);
      nonNullable(
        tx,
        `Cannot find the OutPoint ${outPoint.txHash}#${outPoint.index}`
      );

      return tx.outputs[Number(outPoint.index)].type;
    });

    // contracts may be dependent on `depGroup`, and the `depGroup` cell may not have a type script,
    // so we need to filter out the cells without type script
    const cells = await fetchTypeScriptCell(
      typeScripts.filter(Boolean) as Script[]
    );

    return zipWith(oldOutPoints, typeScripts, (oldOutPoint, typeScript) => {
      nonNullable(oldOutPoint);
      if (!typeScript) {
        return oldOutPoint;
      }

      const [cell] = cells.splice(0, 1);
      return cell.outPoint;
    });
  };
}

type RefreshConfig<S> = {
  resolve: ResolveLatestOutPointsOfTypeIds;
  skip?: (keyof S)[];
};

/**
 * Refreshing the config items in {@link ScriptConfigs} which are deployed with type id
 * @example
 * const updatedScriptConfigs = refreshScriptConfigs(predefined.AGGRON4.SCRIPTS, createRpcResolver(rpc))
 * initializeConfig({ SCRIPTS: updatedScriptConfigs })
 */
export async function refreshScriptConfigs<S extends ScriptConfigs>(
  scriptConfigs: S,
  {
    resolve,
    skip = ["SECP256K1_BLAKE160", "SECP256K1_BLAKE160_MULTISIG", "DAO"],
  }: RefreshConfig<S>
): Promise<S> {
  // prettier-ignore
  type Filter = (value: [string, ScriptConfig | undefined]) => value is [string, ScriptConfig];

  const configs = Object.entries(scriptConfigs).filter(
    (([name, scriptConfig]) =>
      !skip.includes(name) && scriptConfig?.HASH_TYPE === "type") as Filter
  );

  const oldOutPoints: OutPoint[] = configs.map(([_, scriptConfig]) => ({
    txHash: scriptConfig.TX_HASH,
    index: scriptConfig.INDEX,
  }));

  const newOutPoints: OutPoint[] = await resolve(oldOutPoints);

  const newScriptConfigs = Object.fromEntries(
    zipWith(configs, newOutPoints, (target, newOutPoint) => {
      nonNullable(target);
      const [name, original] = target;

      nonNullable(
        newOutPoint,
        `Refreshing failed, cannot load config of ${name}, please check whether the scriptConfig is correct`
      );

      return [
        name,
        { ...original, TX_HASH: newOutPoint.txHash, INDEX: newOutPoint.index },
      ];
    })
  );

  return Object.assign({}, scriptConfigs, newScriptConfigs);
}

function zipWith<L, R, O>(
  left: L[],
  right: R[],
  cb: (a: L | undefined, b: R | undefined) => O
) {
  return left.map((_, i) => cb(left[i], right[i]));
}

function nonNullable<T>(
  value: T,
  message = "Not nullable"
): asserts value is NonNullable<T> {
  if (value == null) {
    throw new Error(message);
  }
}
