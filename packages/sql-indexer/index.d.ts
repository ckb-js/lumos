import Knex from "knex";
import {
  QueryOptions,
  IndexerOptions,
  BaseCellCollector,
  Indexer as BaseIndexer,
} from "@ckb-lumos/base";

export class Indexer extends BaseIndexer {
  constructor(uri: string, knex: Knex, options?: IndexerOptions);
}

export declare class CellCollector extends BaseCellCollector {
  constructor(knex: Knex, queries: QueryOptions);
}
