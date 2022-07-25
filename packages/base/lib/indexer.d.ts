import { Cell, HashType, Transaction, TransactionWithStatus } from "./api";
import { Hash, Hexadecimal, HexString } from "./primitive";
import { Logger } from "./logger";

export type QueryScript = {
  code_hash: Hash;
  hash_type: HashType;
  args: HexString;
}
/**
 * argsLen: if argsLen = 20, it means collected cells cell.cellOutput.lock.args should be 20-byte length, and prefix match to lock.args.
 * And if argsLen = -1 (default), means cell.cellOutput.lock.args should equals to lock.args.
 */
export interface QueryOptions {
  lock?: QueryScript | QueryScriptWrapper;
  type?: QueryScript | QueryScriptWrapper | "empty";
  // data = any means any data content is ok
  data?: string | "any";
  argsLen?: number | "any";
  /** `fromBlock` itself is included in range query. */
  fromBlock?: Hexadecimal;
  /** `toBlock` itself is included in range query. */
  toBlock?: Hexadecimal;
  skip?: number;
  order?: "asc" | "desc";
}

export interface QueryScriptWrapper {
  script: QueryScript;
  ioType?: "input" | "output" | "both";
  argsLen?: number | "any";
}

export interface CellCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Cell>;
}

export interface CellCollector {
  collect(): CellCollectorResults;
}

export interface CellProvider {
  uri?: string;
  collector(queryOptions: QueryOptions): CellCollector;
}

export interface Tip {
  blockNumber: string;
  blockHash: string;
}

export interface IndexerOptions {
  pollIntervalSeconds?: number;
  livenessCheckIntervalSeconds?: number;
  logger?: Logger;
  keepNum?: number;
  pruneInterval?: number;
  rpcOptions?: object;
}

export declare class Indexer {
  uri: string;

  running(): boolean;
  startForever(): void;
  start(): void;
  stop(): void;
  tip(): Promise<Tip>;

  collector(queries: QueryOptions): CellCollector;
  subscribe(queries: QueryOptions): NodeJS.EventEmitter;
  subscribeMedianTime(): NodeJS.EventEmitter;
  waitForSync(blockDifference?: number): Promise<void>;
}

// CellCollector
export declare interface BaseCellCollector extends CellCollector {
  count(): Promise<number>;

  collect(): CellCollectorResults;
}

// TransactionCollector
export interface TransactionCollectorOptions {
  skipMissing?: boolean;
  includeStatus?: boolean;
}

export interface TransactionCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Transaction | TransactionWithStatus>;
}

export declare class TransactionCollector {
  constructor(
    indexer: Indexer,
    queries: QueryOptions,
    options?: TransactionCollectorOptions
  );

  count(): Promise<number>;

  getTransactionHashes(): Promise<HexString[]>;

  collect(): TransactionCollectorResults;
}

export const indexer: {
  TransactionCollector: typeof TransactionCollector;
};
