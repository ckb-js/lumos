import {
  Transaction,
  Hash,
  QueryOptions,
  logger,
  Indexer,
  CellCollector,
} from "@ckb-lumos/base";

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

  sendTransaction(tx: Transaction): Promise<Hash>;

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
