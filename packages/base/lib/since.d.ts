import { HexNumber, PackedSince, HexString, JSBI } from "./primitive";

export interface EpochSinceValue {
  length: number;
  index: number;
  number: number;
}

export type SinceType = "epochNumber" | "blockNumber" | "blockTimestamp";

export interface SinceValidationInfo {
  block_number: HexNumber;
  epoch: HexNumber;
  median_timestamp: HexNumber;
}

/**
 * Parse since and get relative or not, type, and value of since
 *
 * @param since
 */
export function parseSince(
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

export function parseSinceCompatible(
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
      value: JSBI;
    };

/**
 * parse epoch from blockHeader.epoch
 *
 * @param epoch
 */
export function parseEpoch(epoch: HexString): EpochSinceValue;

/**
 * return maximum since of args
 *
 * @param args sinces in absolute-epoch-number format
 */
export function maximumAbsoluteEpochSince(...args: PackedSince[]): PackedSince;

/**
 * generate absolute-epoch-number format since
 *
 * @param params
 */
export function generateAbsoluteEpochSince(
  params: EpochSinceValue
): PackedSince;

/**
 * Will throw an error if since not in absolute-epoch-number format
 *
 * @param since
 */
export function parseAbsoluteEpochSince(since: PackedSince): EpochSinceValue;

/**
 * Will throw an error if since not in absolute-epoch-number format
 *
 * @param since
 * @param tipHeaderEpoch
 */
export function validateAbsoluteEpochSince(
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
export function validateSince(
  since: PackedSince,
  tipSinceValidationInfo: SinceValidationInfo,
  cellSinceValidationInfo?: SinceValidationInfo
): boolean;

/**
 *
 * @param params
 */
export function generateSince(
  params:
    | {
        relative: boolean;
        type: SinceType;
        value: bigint | JSBI;
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
export function generateHeaderEpoch(params: EpochSinceValue): HexString;
