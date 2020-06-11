import * as core from "./lib/core";

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
