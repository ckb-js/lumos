import * as core from "./lib/core";

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
  lock?: Script | null;
  type?: Script | null;
  typeIsNull?: boolean;
  data?: string | null;
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
