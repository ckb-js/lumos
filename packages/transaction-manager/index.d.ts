import { Indexer, CellCollector } from "@ckb-lumos/indexer";
import { Transaction, Hash, QueryOptions, logger } from "@ckb-lumos/base";

declare class TransactionManager {
  constructor(
    indexer: Indexer,
    options?: {
      logger?: logger.Logger;
      pollIntervalSeconds?: number;
    }
  );

  start(): void;

  stop(): void;

  send_transaction(tx: Transaction): Promise<Hash>;

  /**
   * If set `usePendingOutputs` to false, will not use pending outputs, default to true.
   *
   * @param queryOptions
   * @param options
   */
  collector(
    queryOptions?: QueryOptions,
    options?: { usePendingOutputs?: boolean }
  ): CellCollector;
}

export = TransactionManager;
