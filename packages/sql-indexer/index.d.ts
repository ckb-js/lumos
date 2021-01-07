import Knex from "knex";
import {
  QueryOptions,
  IndexerOptions,
  BaseCellCollector,
  Indexer as BaseIndexer,
  TransactionCollector as BaseTransactionCollector,
  TransactionCollectorOptions,
} from "@ckb-lumos/base";

export class Indexer extends BaseIndexer {
  constructor(uri: string, knex: Knex, options?: IndexerOptions);
}

export declare class CellCollector extends BaseCellCollector {
  constructor(knex: Knex, queries: QueryOptions);
}

export declare class TransactionCollector extends BaseTransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );
}
