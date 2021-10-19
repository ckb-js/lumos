import Knex from "knex";
import {
  QueryOptions,
  IndexerOptions,
  BaseCellCollector,
  Indexer as BaseIndexer,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
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
export declare class CellCollector extends BaseCellCollector {
  constructor(knex: Knex, queries: QueryOptions);
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
