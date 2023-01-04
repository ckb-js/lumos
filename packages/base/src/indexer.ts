import { validators } from "@ckb-lumos/toolkit";
import { assertHexadecimal } from "./utils";

import { Cell, Script, Transaction, TransactionWithStatus } from "./api";
import { Hexadecimal, HexString } from "./primitive";
import { Logger } from "./logger";
import { isScriptWrapper } from "./helpers";

/**
 * argsLen: if argsLen = 20, it means collected cells cell.cellOutput.lock.args should be 20-byte length, and prefix match to lock.args.
 * And if argsLen = -1 (default), means cell.cellOutput.lock.args should equals to lock.args.
 */
export interface QueryOptions {
  lock?: Script | ScriptWrapper;
  type?: Script | ScriptWrapper | "empty";
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

export interface ScriptWrapper {
  script: Script;
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
  // eslint-disable-next-line @typescript-eslint/ban-types
  rpcOptions?: object;
}

/**
 * @deprecated please use CellProvider
 */
export abstract class Indexer {
  abstract uri: string;

  abstract running(): boolean;
  abstract startForever(): void;
  abstract start(): void;
  abstract stop(): void;
  abstract tip(): Promise<Tip>;

  abstract collector(queries: QueryOptions): CellCollector;
  abstract subscribe(queries: QueryOptions): NodeJS.EventEmitter;
  abstract subscribeMedianTime(): NodeJS.EventEmitter;
  abstract waitForSync(blockDifference?: number): Promise<void>;
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

// Notice this TransactionCollector implementation only uses indexer
// here. Since the indexer we use doesn't store full transaction data,
// we will have to run CKB RPC queries on each tx hash to fetch transaction
// data. In some cases this might slow your app down. An ideal solution would
// be combining this with some cacher to accelerate this process.
class TransactionCollector {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rpc: any;
  lock: ScriptWrapper | undefined;
  type: "empty" | ScriptWrapper | Script | undefined;
  indexer: Indexer;
  skipMissing: boolean;
  includeStatus: boolean;
  fromBlock: Hexadecimal | undefined;
  toBlock: Hexadecimal | undefined;
  order: "asc" | "desc";
  skip: number | undefined;

  constructor(
    indexer: Indexer,
    {
      lock,
      type,
      argsLen = -1,
      fromBlock,
      toBlock,
      order = "asc",
      skip,
    }: QueryOptions = {},
    {
      skipMissing = false,
      includeStatus = true,
    }: TransactionCollectorOptions = {}
  ) {
    if (!lock && (!type || type === "empty")) {
      throw new Error("Either lock or type script must be provided!");
    }
    // Wrap the plain `Script` into `ScriptWrapper`.
    if (lock && !isScriptWrapper(lock)) {
      validators.ValidateScript(lock);
      this.lock = { script: lock, ioType: "both", argsLen: argsLen };
    } else if (lock && lock.script) {
      validators.ValidateScript(lock.script);
      this.lock = lock;
      // check ioType, argsLen
      if (!lock.argsLen) {
        this.lock.argsLen = argsLen;
      }
      if (!lock.ioType) {
        this.lock.ioType = "both";
      }
    }
    if (type === "empty") {
      this.type = type;
    } else if (type && !isScriptWrapper(type)) {
      validators.ValidateScript(type);
      this.type = { script: type, ioType: "both", argsLen: argsLen };
    } else if (type && type.script) {
      validators.ValidateScript(type.script);
      this.type = type;
      // check ioType, argsLen
      if (!type.argsLen) {
        this.type.argsLen = argsLen;
      }
      if (!type.ioType) {
        this.type.ioType = "both";
      }
    }
    if (fromBlock) {
      assertHexadecimal("fromBlock", fromBlock);
    }
    if (toBlock) {
      assertHexadecimal("toBlock", toBlock);
    }
    if (order !== "asc" && order !== "desc") {
      throw new Error("Order must be either asc or desc!");
    }
    this.indexer = indexer;
    this.skipMissing = skipMissing;
    this.includeStatus = includeStatus;
    this.fromBlock = fromBlock;
    this.toBlock = toBlock;
    this.order = order;
    this.skip = skip;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.rpc = (indexer as any).rpc;
  }

  async getTransactionHashes(): Promise<HexString[]> {
    throw new Error("Not implement!");
  }

  async count(): Promise<number> {
    const hashes = await this.getTransactionHashes();
    return hashes.length;
  }

  async *collect(): TransactionCollectorResults {
    const hashes = await this.getTransactionHashes();
    for (const hash of hashes) {
      const tx = await this.rpc.get_transaction(hash);
      if (!this.skipMissing && !tx) {
        throw new Error(`Transaction ${hash} is missing!`);
      }
      if (this.includeStatus) {
        yield tx;
      } else {
        yield tx.transaction;
      }
    }
  }
}

const indexer = {
  TransactionCollector,
};

export default indexer;
export { TransactionCollector };
