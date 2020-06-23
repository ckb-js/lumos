import * as core from "./lib/core";

export type HexString = string;
export type Hash = HexString;
export type PackedSince = string;
export type PackedDao = string;

export interface Header {
  timestamp: HexString;
  number: HexString;
  epoch: HexString;
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
  lock?: Script;
  type?: Script | "empty";
  data?: string;
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

export declare const utils: {
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
   * return larger one of two sinces
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
};
