import {
  QueryOptions,
  Indexer as BaseIndexer,
  IndexerOptions,
  BaseCellCollector,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
} from "@ckb-lumos/base";

/**
 * @deprecated since version 0.17.0-rc5
 */
export declare class Indexer extends BaseIndexer {
  constructor(uri: string, path: string, options?: IndexerOptions);
}

/**
 * @deprecated since version 0.17.0-rc5
 */
export declare class CellCollector extends BaseCellCollector {
  constructor(indexer: Indexer, queries: QueryOptions);
}

/**
 * @deprecated since version 0.17.0-rc5
 */
export declare class TransactionCollector extends BaseTransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );
}
