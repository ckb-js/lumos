import * as core from "./lib/core";
export { core };

import { Reader } from "ckb-js-toolkit";

/**
 * HexString represents string starts with "0x" and followed by even number(including empty) of [0-9a-fA-F] characters.
 */
export type HexString = string;
/**
 * Hexadecimal represents string starts with "0x" and followed by any number(excluding empty) of [0-9a-fA-F] characters.
 */
export type Hexadecimal = string;
export type Hash = HexString;
export type HexNumber = Hexadecimal;
export type PackedSince = string;
export type PackedDao = string;

export type Address = string;

export interface Header {
  timestamp: HexString;
  number: HexString;
  epoch: HexString;
  compact_target: HexString;
  dao: Hash;
  hash: Hash;
  nonce: HexString;
  parent_hash: Hash;
  proposals_hash: Hash;
  transactions_root: Hash;
  uncles_hash: Hash;
  version: HexString;
}

export type HashType = "type" | "data";
export interface Script {
  code_hash: Hash;
  hash_type: HashType;
  args: HexString;
}

export interface OutPoint {
  tx_hash: Hash;
  index: HexString;
}

export type DepType = "dep_group" | "code";
export interface CellDep {
  out_point: OutPoint;
  dep_type: DepType;
}

export interface Input {
  previous_output: OutPoint;
  since: PackedSince;
}

export interface Output {
  capacity: HexString;
  lock: Script;
  type?: Script;
}

export interface WitnessArgs {
  lock?: HexString;
  input_type?: HexString;
  output_type?: HexString;
}
export interface RawTransaction {
  cell_deps: CellDep[];
  hash?: Hash;
  header_deps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputs_data: HexString[];
  version: HexString;
}
export interface Transaction {
  cell_deps: CellDep[];
  hash?: Hash;
  header_deps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputs_data: HexString[];
  version: HexString;
  witnesses: HexString[];
}

export interface TxStatus {
  block_hash?: Hash;
  status: string;
}

export interface TransactionWithStatus {
  transaction: Transaction;
  tx_status: TxStatus;
}

export interface Cell {
  cell_output: {
    capacity: HexString;
    lock: Script;
    type?: Script;
  };
  data: HexString;
  out_point?: OutPoint;
  block_hash?: Hash;
  block_number?: HexString;
}

/**
 * argsLen: if argsLen = 20, it means collected cells cell.cell_output.lock.args should be 20-byte length, and prefix match to lock.args.
 * And if argsLen = -1 (default), means cell.cell_output.lock.args should equals to lock.args.
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

declare class CKBHasher {
  update(data: string | Reader | ArrayBuffer): this;

  digestReader(): Reader;

  digestHex(): Hash;
}

export declare const utils: {
  CKBHasher: typeof CKBHasher;

  ckbHash(buffer: ArrayBuffer): Reader;

  /**
   * convert bigint to BigUInt64 little-endian hex string
   *
   * @param num
   */
  toBigUInt64LE(num: bigint): HexString;

  /**
   * convert BigUInt64 little-endian hex string to bigint
   *
   * @param hex BigUInt64 little-endian hex string
   */
  readBigUInt64LE(hex: HexString): bigint;

  /**
   * convert bigint to BigUInt128 little-endian hex string
   *
   * @param u128
   */
  toBigUInt128LE(u128: bigint): string;

  /**
   * convert BigUInt64 little-endian hex string to bigint
   *
   * @param leHex BigUInt128 little-endian hex string
   */
  readBigUInt128LE(leHex: HexString): bigint;

  /**
   * compute lock/type hash
   *
   * @param script
   * @param options
   */
  computeScriptHash(script: Script, options?: { validate?: boolean }): Hash;

  hashCode(buffer: Buffer): number;

  assertHexString(debugPath: string, str: string): void;

  assertHexadecimal(debugPath: string, str: string): void;
};

export declare const helpers: {
  /**
   * Check a cell is match QueryOptions or not, not support `skip` and `order`
   *
   * @param cell
   * @param queryOptions
   */
  isCellMatchQueryOptions(cell: Cell, queryOptions: QueryOptions): boolean;
};

export interface EpochSinceValue {
  length: number;
  index: number;
  number: number;
}

export type SinceType = "epochNumber" | "blockNumber" | "blockTimestamp";

export declare const since: {
  /**
   * Parse since and get relative or not, type, and value of since
   *
   * @param since
   */
  parseSince(
    since: PackedSince
  ):
    | {
        relative: boolean;
        type: "epochNumber";
        value: EpochSinceValue;
      }
    | {
        relative: boolean;
        type: "blockNumber" | "blockTimestamp";
        value: bigint;
      };

  /**
   * parse epoch from blockHeader.epoch
   *
   * @param epoch
   */
  parseEpoch(epoch: HexString): EpochSinceValue;

  /**
   * return maximum since of args
   *
   * @param args sinces in absolute-epoch-number format
   */
  maximumAbsoluteEpochSince(...args: PackedSince[]): PackedSince;

  /**
   * generate absolute-epoch-number format since
   *
   * @param params
   */
  generateAbsoluteEpochSince(params: EpochSinceValue): PackedSince;

  /**
   * Will throw an error if since not in absolute-epoch-number format
   *
   * @param since
   */
  parseAbsoluteEpochSince(since: PackedSince): EpochSinceValue;

  /**
   * Will throw an error if since not in absolute-epoch-number format
   *
   * @param since
   * @param tipHeaderEpoch
   */
  validateAbsoluteEpochSince(
    since: PackedSince,
    tipHeaderEpoch: HexString
  ): boolean;

  /**
   * Compare since with tipHeader, check since is valid or not.
   *
   * @param since
   * @param tipHeader
   * @param sinceHeader can left empty if absolute since
   */
  validateSince(
    since: PackedSince,
    tipHeader: Header,
    sinceHeader?: Header
  ): boolean;

  /**
   *
   * @param params
   */
  generateSince(
    params:
      | {
          relative: boolean;
          type: SinceType;
          value: bigint;
        }
      | {
          relative: boolean;
          type: "epochNumber";
          value: EpochSinceValue;
        }
  ): PackedSince;

  /**
   * generate header epoch from epoch since value
   *
   * @param params
   */
  generateHeaderEpoch(params: EpochSinceValue): HexString;
};

export declare const denormalizers: {
  DenormalizeOutPoint(outPoint: core.OutPoint): OutPoint;

  DenormalizeScript(script: core.Script): Script;
};

declare class Value {
  equals(other: Value): boolean;

  hashCode(): number;

  hash(): Hash;
}

declare class ScriptValue extends Value {
  constructor(script: Script, options: { validate?: boolean });
}

declare class OutPointValue extends Value {
  constructor(outPoint: OutPoint, options: { validate?: boolean });
}
declare class RawTransactionValue extends Value {
  constructor(rawTransaction: RawTransaction, options?: { validate?: boolean });
}

declare class TransactionValue extends Value {
  constructor(transaction: Transaction, options?: { validate?: boolean });
}

export declare const values: {
  ScriptValue: typeof ScriptValue;
  OutPointValue: typeof OutPointValue;
  TransactionValue: typeof TransactionValue;
  RawTransactionValue: typeof RawTransactionValue;
};

// Indexer
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
  waitForSync(blockDifference: number): Promise<void>;
}

// CellCollector
export declare class BaseCellCollector implements CellCollector {
  count(): Promise<number>;

  collect(): CellCollectorResults;
}
