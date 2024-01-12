import type {
  OutPoint,
  Script,
  Transaction,
  TransactionWithStatus,
} from "@ckb-lumos/base";
import type { ScriptConfig, ScriptConfigs } from "./types";
import type { RPC } from "@ckb-lumos/rpc";
import type { CKBComponents } from "@ckb-lumos/rpc/lib/types/api";

type MaybePromise<T> = T | PromiseLike<T>;

type LatestOutpointResolver = (
  outPoints: OutPoint[]
) => MaybePromise<OutPoint[]>;

type FetchTxs = (txHashes: string[]) => MaybePromise<Transaction[]>;
type FetchTypeIdCells = (
  scripts: Script[]
) => MaybePromise<CKBComponents.IndexerCellWithoutData[]>;

/* c8 ignore next 39 */
export function createRpcResolver(rpc: RPC): LatestOutpointResolver {
  const fetchTxs: FetchTxs = async (txHashes) => {
    const txs: TransactionWithStatus[] = await rpc
      .createBatchRequest(txHashes.map((txHash) => ["getTransaction", txHash]))
      .exec();

    return zipWith(txHashes, txs, (txHash, tx) => {
      if (!tx?.transaction) {
        throw new Error(`Cannot find transaction ${txHash}`);
      }
      return tx.transaction;
    });
  };

  const fetchIndexerCells: FetchTypeIdCells = async (typeIds) => {
    const res: CKBComponents.GetLiveCellsResult<false>[] = await rpc
      .createBatchRequest(
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

    return res.map<CKBComponents.IndexerCellWithoutData>(
      (item) => item.objects[0]
    );
  };

  return createResolver(fetchTxs, fetchIndexerCells);
}

export function createResolver(
  fetchTxs: FetchTxs,
  fetchTypeScriptCell: FetchTypeIdCells
): LatestOutpointResolver {
  return async (oldOutPoints) => {
    const txs = await fetchTxs(oldOutPoints.map((outPoint) => outPoint.txHash));

    const typeScripts = zipWith(oldOutPoints, txs, (outPoint, tx) => {
      nonNullable(outPoint);

      nonNullable(
        tx,
        `Cannot find the OutPoint ${outPoint.txHash}#${outPoint.index}`
      );

      return tx.outputs[Number(outPoint.index)].type;
    });

    const cells = await fetchTypeScriptCell(
      typeScripts.filter(Boolean) as Script[]
    );

    return zipWith(oldOutPoints, typeScripts, (oldOutPoint, script) => {
      nonNullable(oldOutPoint);
      if (!script) {
        return oldOutPoint;
      }

      const [cell] = cells.splice(0, 1);
      return cell.outPoint;
    });
  };
}

type RefreshConfig<S> = {
  resolve: LatestOutpointResolver;
  skip?: (keyof S)[];
};

/**
 * Refreshing the config items in {@link ScriptConfigs} which are deployed with type id
 * @example
 * const updatedScriptConfigs = upgrade(predefined.AGGRON4.SCRIPTS, createRpcResolver(rpc))
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

function zipWith<A, B, T>(
  a: A[],
  b: B[],
  cb: (a: A | undefined, b: B | undefined) => T
) {
  return a.map((_, i) => cb(a[i], b[i]));
}

function nonNullable<T>(
  t: T,
  message = "Not nullable"
): asserts t is NonNullable<T> {
  if (t == null) {
    throw new Error(message);
  }
}
