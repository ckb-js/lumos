import * as core from "./lib/core";

export interface Header {
  timestamp: string;
  number: string;
  epoch: string;
}

export interface Script {
  code_hash: string;
  hash_type: string;
  args: string;
}

export interface OutPoint {
  tx_hash: string;
  index: string;
}

export interface CellDep {
  out_point: OutPoint;
  dep_type: string;
}

export interface Cell {
  cell_output: {
    capacity: string;
    lock: Script;
    type?: Script;
  };
  data: string;
  out_point: OutPoint;
  block_hash: string;
  block_number: string;
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
   * @param num bigint or number type can using BigInt() to convert to bigint
   */
  toBigUInt64LE(num: bigint | string): string;

  /**
   * convert BigUInt64 little-endian hex string to bigint
   *
   * @param hex BigUInt64 little-endian hex string
   */
  readBigUInt64LE(hex: string): bigint;
};

export interface EpochSinceValue {
  length: bigint;
  index: bigint;
  number: bigint;
}

export type SinceType = "epochNumber" | "blockNumber" | "blockTimestamp";

export declare const since: {
  /**
   * Parse since and get relative or not, type, and value of since
   *
   * @param since
   */
  parseSince(
    since: bigint
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
  parseEpoch(epoch: bigint | string): EpochSinceValue;

  /**
   * return larger one of two sinces
   *
   * @param one since in absolute-epoch-number format
   * @param another since in absolute-epoch-number format
   */
  largerAbsoluteEpochSince(one: bigint, another: bigint): bigint;

  /**
   * generate absolute-epoch-number format since
   *
   * @param params
   */
  generateAbsoluteEpochSince(params: EpochSinceValue): bigint;

  /**
   * Will throw an error if since not in absolute-epoch-number format
   *
   * @param since
   */
  parseAbsoluteEpochSince(since: bigint): EpochSinceValue;

  /**
   * Will throw an error if since not in absolute-epoch-number format
   *
   * @param since
   * @param tipHeaderEpoch
   */
  checkAbsoluteEpochSinceValid(
    since: bigint,
    tipHeaderEpoch: string | bigint
  ): boolean;

  /**
   * Compare since with tipHeader, check since is valid or not.
   *
   * @param since
   * @param tipHeader
   * @param sinceHeader
   */
  checkSinceValid(
    since: bigint,
    tipHeader: Header,
    sinceHeader: Header
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
  ): bigint;
};
