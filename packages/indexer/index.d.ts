import {
  QueryOptions,
  Transaction,
  TransactionWithStatus,
  Indexer as BaseIndexer,
  IndexerOptions,
  BaseCellCollector,
} from "@ckb-lumos/base";

export interface TransactionCollectorOptions {
  skipMissing?: boolean;
  includeStatus?: boolean;
}

export interface TransactionCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Transaction | TransactionWithStatus>;
}

export declare class TransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );

  count(): Promise<number>;

  collect(): TransactionCollectorResults;
}

export declare class Indexer extends BaseIndexer {
  constructor(uri: string, path: string, options?: IndexerOptions);
}

export declare class CellCollector extends BaseCellCollector {
  constructor(indexer: Indexer, queries: QueryOptions);
}
