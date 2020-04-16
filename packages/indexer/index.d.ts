import {
  CellCollectorResults,
  CellCollector as CellCollectorInterface,
} from "ckb-js-toolkit";

export type Logger = (level: string, message: string) => void;

export interface IndexerOptions {
  pollIntervalSeconds?: number;
  livenessCheckIntervalSeconds?: number;
  logger?: Logger;
}

export interface Tip {
  block_number: string;
  block_hash: string;
}

export interface IndexerQueryOptions {
  validateFirst?: boolean;
}

// TODO: change those when we have proper typing for all the CKB data structures.
export interface Script {
  code_hash: string;
  hash_type: string;
  args: string;
}

export interface OutPoint {
  tx_hash: string;
  index: string;
}

export class Indexer {
  constructor(uri: string, path: string, options?: IndexerOptions);

  running(): boolean;
  startForever(): void;
  start(): void;
  stop(): void;
  tip(): Tip;
  getLiveCellsByLockScript(
    script: Script,
    options?: IndexerQueryOptions
  ): Array<OutPoint>;
  getLiveCellsByTypeScript(
    script: Script,
    options?: IndexerQueryOptions
  ): Array<OutPoint>;
  getTransactionsByLockScript(
    script: Script,
    options?: IndexerQueryOptions
  ): Array<string>;
  getTransactionsByTypeScript(
    script: Script,
    options?: IndexerQueryOptions
  ): Array<string>;
}

export interface CollectorQueries {
  lock?: Script;
  type_?: Script;
}

export interface CellCollectorOptions {
  skipNotLive?: boolean;
}

export interface TransactionCollectorOptions {
  skipMissing?: boolean;
  includeStatus?: boolean;
}

export class CellCollector implements CellCollectorInterface {
  constructor(
    indexer: Indexer,
    queries: CollectorQueries,
    options?: CellCollectorOptions
  );

  collect(): CellCollectorResults;
}

export class TransactionCollector implements CellCollectorInterface {
  constructor(
    indexer: Indexer,
    queries: CollectorQueries,
    options?: TransactionCollectorOptions
  );

  collect(): CellCollectorResults;
}
