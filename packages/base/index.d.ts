import * as core from "./lib/core";
import { Reader } from "ckb-js-toolkit";

export type HexString = string;
export type Hash = HexString;
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

export interface ScriptWrapper {
  script: Script;
  io_type: "input" | "output";
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

export interface Transaction {
  cell_deps: CellDep[];
  hash: Hash;
  header_deps: Hash[];
  inputs: Input[];
  outputs: Output[];
  outputs_data: HexString[];
  version: HexString;
  witnesses: HexString[];
}

export interface Cell {
  cell_output: {
    capacity: HexString;
    lock: Script;
    type?: Script;
  };
  data: HexString;
  out_point: OutPoint;
  block_hash: Hash;
  block_number: HexString;
}
export interface QueryOptions {
  lock?: Script | ScriptWrapper;
  type?: Script | ScriptWrapper | "empty";
  data?: string;
  argsLen?: number;
  /** `fromBlock` itself is included in range query. */
  fromBlock?: number;
  /** `toBlock` itself is included in range query. */
  toBlock?: number;
}

export interface CellCollectorResults {
  [Symbol.asyncIterator](): AsyncIterator<Cell>;
}

export interface CellCollector {
  collect(): CellCollectorResults;
}

export interface CellProvider {
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
  constructor(out_point: OutPoint, options: { validate?: boolean });
}

declare class TransactionValue extends Value {
  constructor(transaction: Transaction, options?: { validate?: boolean });
}

export declare const values: {
  ScriptValue: typeof ScriptValue;
  OutPointValue: typeof OutPointValue;
  TransactionValue: typeof TransactionValue;
};
