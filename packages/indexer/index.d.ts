import {
  QueryOptions,
  Indexer as BaseIndexer,
  IndexerOptions,
  BaseCellCollector,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
  CellCollectorResults,
} from "@ckb-lumos/base";

/**
 * @deprecated since version 0.17.0-rc5, please migrate to `@ckb-lumos/ckb-indexer`
 */
export declare class Indexer extends BaseIndexer {
  constructor(uri: string, path: string, options?: IndexerOptions);
}

/**
 * @deprecated since version 0.17.0-rc5, please migrate to `@ckb-lumos/ckb-indexer`
 */
export declare class CellCollector implements BaseCellCollector {
  constructor(indexer: Indexer, queries: QueryOptions);
  count(): Promise<number>;
  collect(): CellCollectorResults;
}

/**
 * @deprecated since version 0.17.0-rc5, please migrate to `@ckb-lumos/ckb-indexer`
 */
export declare class TransactionCollector extends BaseTransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );
}
