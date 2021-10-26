import {
  QueryOptions,
  Indexer as BaseIndexer,
  IndexerOptions,
  BaseCellCollector,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
  CellCollectorResults,
} from "@ckb-lumos/base";

export declare class Indexer extends BaseIndexer {
  constructor(uri: string, path: string, options?: IndexerOptions);
}

export declare class CellCollector implements BaseCellCollector {
  constructor(indexer: Indexer, queries: QueryOptions);
  count(): Promise<number>;
  collect(): CellCollectorResults;
}

export declare class TransactionCollector extends BaseTransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );
}
