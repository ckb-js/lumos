import { BIish, BI, isBIish } from "@ckb-lumos/bi";
import { HexNumber, PackedSince, HexString } from "./primitive";

export type SinceType = "epochNumber" | "blockNumber" | "blockTimestamp";

export interface EpochSinceValue {
  length: number;
  index: number;
  number: number;
}
export interface SinceValidationInfo {
  blockNumber: HexNumber;
  epoch: HexNumber;
  median_timestamp: HexNumber;
}

/**
 * Parse since and get relative or not, type, and value of since
 *
 * @param since
 */
function parseSince(since: PackedSince):
  | {
      relative: boolean;
      type: "epochNumber";
      value: EpochSinceValue;
    }
  | {
      relative: boolean;
      type: "blockNumber" | "blockTimestamp";
      value: bigint;
    } {
  const result = parseSinceCompatible(since);

  if (result.type === "epochNumber") return result;
  return { ...result, value: result.value.toBigInt() };
}

type SinceParseResult =
  | { relative: boolean; type: "epochNumber"; value: EpochSinceValue }
  | { relative: boolean; type: "blockNumber" | "blockTimestamp"; value: BI };

function parseSinceCompatible(since: PackedSince): SinceParseResult {
  const sinceBI = BI.from(since);
  const flag = sinceBI.shr(56);
  const metricFlag = flag.shr(5).and("0b11");
  let type: "blockNumber" | "epochNumber" | "blockTimestamp";
  let value: BI | EpochSinceValue;
  if (metricFlag.eq(0b00)) {
    type = "blockNumber";
    value = sinceBI.and("0xFFFFFFFFFFFFFF");
  } else if (metricFlag.eq(0b01)) {
    type = "epochNumber";
    value = {
      length: sinceBI.shr(40).and(0xffff).toNumber(),
      index: sinceBI.shr(24).and(0xffff).toNumber(),
      number: sinceBI.and(0xffffff).toNumber(),
    };
  } else if (metricFlag.eq(0b10)) {
    type = "blockTimestamp";
    value = sinceBI.and("0xFFFFFFFFFFFFFF");
  } else {
    throw new Error("Invalid metric flag!");
  }

  return {
    relative: !flag.and("0x80").eq(0),
    type,
    value,
  } as SinceParseResult;
}

function generateSince({
  relative,
  type,
  value,
}:
  | {
      relative: boolean;
      type: SinceType;
      value: BIish;
    }
  | {
      relative: boolean;
      type: "epochNumber";
      value: EpochSinceValue;
    }): string {
  let flag = BI.from(0);

  if (relative) {
    flag = flag.add(0b10000000);
  }

  if (type === "epochNumber") {
    flag = flag.add(0b00100000);
  } else if (type === "blockTimestamp") {
    flag = flag.add(0b01000000);
  }

  let v;
  if (isBIish(value)) {
    v = BI.from(value);
  } else if (typeof value === "object") {
    v = generateHeaderEpoch(value);
  } else {
    v = BI.from(value);
  }
  return _toHex(flag.shl(56).add(v));
}

/**
 * parse epoch from blockHeader.epoch
 *
 * @param epoch
 */
function parseEpoch(epoch: BIish): EpochSinceValue {
  const epochBI = BI.from(epoch);
  return {
    length: epochBI.shr(40).and(0xffff).toNumber(),
    index: epochBI.shr(24).and(0xffff).toNumber(),
    number: epochBI.and(0xffffff).toNumber(),
  };
}

/**
 * return maximum since of args
 *
 * @param args sinces in absolute-epoch-number format
 */
function maximumAbsoluteEpochSince(...args: PackedSince[]): string {
  const parsedArgs = args.map((arg) => parseAbsoluteEpochSince(arg));
  const maxNumber = Math.max(...parsedArgs.map((arg) => arg.number));
  const maxArgs = parsedArgs.filter((arg) => arg.number === maxNumber);
  let max = maxArgs[0];

  for (let i = 1; i < maxArgs.length; ++i) {
    const current = maxArgs[i];
    if (
      BI.from(current.index)
        .mul(max.length)
        .gte(BI.from(max.index).mul(current.length))
    ) {
      max = current;
    }
  }

  return generateAbsoluteEpochSince(max);
}

/**
 * generate absolute-epoch-number format since
 *
 * @param params
 */
function generateAbsoluteEpochSince({
  length,
  index,
  number,
}: EpochSinceValue): PackedSince {
  return generateSince({
    relative: false,
    type: "epochNumber",
    value: { length, index, number },
  });
}

/**
 * generate header epoch from epoch since value
 *
 * @param params
 */
function generateHeaderEpoch({
  length,
  index,
  number,
}: EpochSinceValue): HexString {
  return _toHex(
    BI.from(length).shl(40).add(BI.from(index).shl(24)).add(number)
  );
}

/**
 * Will throw an error if since not in absolute-epoch-number format
 *
 * @param since
 */
function parseAbsoluteEpochSince(since: PackedSince): EpochSinceValue {
  const { relative, type, value } = parseSinceCompatible(since);

  if (!(relative === false && type === "epochNumber")) {
    throw new Error("Since format error!");
  }

  return value as EpochSinceValue;
}

/**
 * Will throw an error if since not in absolute-epoch-number format
 *
 * @param since
 * @param tipHeaderEpoch
 */
function validateAbsoluteEpochSince(
  since: PackedSince,
  tipHeaderEpoch: HexString
): boolean {
  const value = parseSinceCompatible(since).value as EpochSinceValue;
  const headerEpochParams = parseEpoch(tipHeaderEpoch);
  return (
    BI.from(value.number).lt(headerEpochParams.number) ||
    (BI.from(value.number).eq(headerEpochParams.number) &&
      BI.from(value.index)
        .mul(headerEpochParams.length)
        .lte(BI.from(headerEpochParams.index).mul(value.length)))
  );
}

/**
 * Compare since with tipHeader, check since is valid or not.
 *
 * @param since
 * @param tipHeader
 * @param sinceHeader can left empty if absolute since
 */
function validateSince(
  since: PackedSince,
  tipSinceValidationInfo: SinceValidationInfo,
  cellSinceValidationInfo: SinceValidationInfo
): boolean {
  const { relative, type, value } = parseSinceCompatible(since);

  if (!relative) {
    if (type === "epochNumber") {
      return validateAbsoluteEpochSince(since, tipSinceValidationInfo.epoch);
    }

    if (type === "blockNumber") {
      return BI.from(value).lte(tipSinceValidationInfo.blockNumber);
    }

    if (type === "blockTimestamp") {
      if (!tipSinceValidationInfo.median_timestamp) {
        throw new Error(`Must provide tip median_timestamp!`);
      }
      return BI.from(value)
        .mul(1000)
        .lte(tipSinceValidationInfo.median_timestamp);
    }
  } else {
    if (type === "epochNumber") {
      const tipHeaderEpoch = parseEpoch(tipSinceValidationInfo.epoch);
      const sinceHeaderEpoch = parseEpoch(cellSinceValidationInfo.epoch);
      const added: Record<keyof EpochSinceValue, BI> = {
        number: BI.from((value as EpochSinceValue).number).add(
          sinceHeaderEpoch.number
        ),
        index: BI.from((value as EpochSinceValue).index)
          .mul(sinceHeaderEpoch.length)
          .add(
            BI.from(sinceHeaderEpoch.index).mul(
              (value as EpochSinceValue).length
            )
          ),
        length: BI.from((value as EpochSinceValue).length).mul(
          sinceHeaderEpoch.length
        ),
      };

      if (
        (value as EpochSinceValue).length === 0 &&
        sinceHeaderEpoch.length !== 0
      ) {
        added.index = BI.from(sinceHeaderEpoch.index);
        added.length = BI.from(sinceHeaderEpoch.length);
      } else if (
        sinceHeaderEpoch.length === 0 &&
        (value as EpochSinceValue).length !== 0
      ) {
        added.index = BI.from((value as EpochSinceValue).index);
        added.length = BI.from((value as EpochSinceValue).length);
      }

      if (
        !BI.from(added.length).eq(0) &&
        BI.from(added.index).gte(added.length)
      ) {
        added.number = added.index.div(added.length).add(added.number);
        added.index = added.index.mod(added.length);
      }

      return (
        BI.from(added.number).lt(tipHeaderEpoch.number) ||
        (BI.from(added.number).eq(tipHeaderEpoch.number) &&
          BI.from(added.index)
            .mul(tipHeaderEpoch.length)
            .lte(BI.from(tipHeaderEpoch.index).mul(added.length)))
      );
    }

    if (type === "blockNumber") {
      return BI.from(value)
        .add(cellSinceValidationInfo.blockNumber)
        .lte(tipSinceValidationInfo.blockNumber);
    }

    if (type === "blockTimestamp") {
      if (
        !tipSinceValidationInfo.median_timestamp ||
        !cellSinceValidationInfo.median_timestamp
      ) {
        throw new Error(`Must provide median_timestamp!`);
      }
      return BI.from(value)
        .mul(1000)
        .add(cellSinceValidationInfo.median_timestamp)
        .lte(tipSinceValidationInfo.median_timestamp);
    }
  }

  return false;
}

function _toHex(num: number | BI) {
  return "0x" + num.toString(16);
}

export {
  parseSince,
  parseSinceCompatible,
  parseEpoch,
  maximumAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  parseAbsoluteEpochSince,
  validateAbsoluteEpochSince,
  validateSince,
  generateSince,
  generateHeaderEpoch,
};
