import {
  QueryOptions,
  Indexer as BaseIndexer,
  IndexerOptions,
  BaseCellCollector,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
} from "@ckb-lumos/base";

export declare class Indexer extends BaseIndexer {
  constructor(uri: string, path: string, options?: IndexerOptions);
}

export declare class CellCollector extends BaseCellCollector {
  constructor(indexer: Indexer, queries: QueryOptions);
}

export declare class TransactionCollector extends BaseTransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );
}
