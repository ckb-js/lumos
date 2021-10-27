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
 * @deprecated since version 0.17.0-rc5
 */
export class Indexer extends BaseIndexer {
  constructor(uri: string, knex: Knex, options?: IndexerOptions);
}

/**
 * @deprecated since version 0.17.0-rc5
 */
export declare class CellCollector implements BaseCellCollector {
  constructor(knex: Knex, queries: QueryOptions);
  count(): Promise<number>;
  collect(): CellCollectorResults;
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
