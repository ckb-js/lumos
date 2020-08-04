import {
  QueryOptions,
  Transaction,
  CellCollector as CellCollectorInterface,
  CellCollectorResults,
} from "@ckb-lumos/base";

export type Logger = (level: string, message: string) => void;

export interface IndexerOptions {
  pollIntervalSeconds?: number;
  livenessCheckIntervalSeconds?: number;
  logger?: Logger;
  keepNum?: number;
  pruneInterval?: number;
}

export interface Tip {
  block_number: string;
  block_hash: string;
}

export interface TransactionCollectorOptions {
  skipMissing?: boolean;
  includeStatus?: boolean;
}

export declare class CellCollector implements CellCollectorInterface {
  constructor(indexer: Indexer, queries: QueryOptions);

  count(): Promise<number>;

  collect(): CellCollectorResults;
}

export interface TransactionCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Transaction>;
}

export declare class TransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );

  count(): Promise<number>;

  collect(): TransactionCollectorResults;
}

export declare class Indexer {
  constructor(uri: string, path: string, options?: IndexerOptions);

  running(): boolean;
  startForever(): void;
  start(): void;
  stop(): void;
  tip(): Promise<Tip>;

  collector(queries: QueryOptions): CellCollector;
  subscribe(queries: QueryOptions): NodeJS.EventEmitter;
}
