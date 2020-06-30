import { Indexer, Logger, CellCollector } from "@ckb-lumos/indexer";
import { Transaction, Hash, QueryOptions } from "@ckb-lumos/base";

declare class TransactionManager {
  constructor(
    indexer: Indexer,
    options?: {
      logger?: Logger;
      pollIntervalSeconds?: number;
    }
  );

  start(): void;

  stop(): void;

  send_transaction(tx: Transaction): Promise<Hash>;

  collector(queryOptions?: QueryOptions): CellCollector;
}

export = TransactionManager;
