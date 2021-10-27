import Knex from "knex";
import {
  QueryOptions,
  IndexerOptions,
  BaseCellCollector,
  Indexer as BaseIndexer,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
  CellCollectorResults,
} from "@ckb-lumos/base";

/**
 * @deprecated @deprecated since version 0.17.0-rc5, please migrate to `@ckb-lumos/ckb-indexer`
 */
export class Indexer extends BaseIndexer {
  constructor(uri: string, knex: Knex, options?: IndexerOptions);
}

/**
 * @deprecated @deprecated since version 0.17.0-rc5, please migrate to `@ckb-lumos/ckb-indexer`
 */
export declare class CellCollector implements BaseCellCollector {
  constructor(knex: Knex, queries: QueryOptions);
  count(): Promise<number>;
  collect(): CellCollectorResults;
}

/**
 * @deprecated @deprecated since version 0.17.0-rc5, please migrate to `@ckb-lumos/ckb-indexer`
 */
export declare class TransactionCollector extends BaseTransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );
}
