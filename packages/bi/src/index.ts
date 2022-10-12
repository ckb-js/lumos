import JSBI from "jsbi";
export type BIish = number | string | bigint | BI;

export function isBIish(value: unknown): value is BIish {
  return (
    value !== null &&
    ((typeof value === "number" && value % 1 === 0) ||
      (typeof value === "string" &&
        (!!value.match(/^0x(0|[0-9a-fA-F]+)$/) ||
          !!value.match(/^-?[0-9]+$/))) ||
      typeof value === "bigint" ||
      BI.isBI(value))
  );
}

export class BI {
  private readonly jsbi: JSBI;
  readonly _isBI: boolean;

  constructor(value: JSBI) {
    this.jsbi = value;
    this._isBI = true;
  }

  add(other: BIish): BI {
    return toBI(JSBI.add(this.jsbi, toJSBI(other)));
  }

  sub(other: BIish): BI {
    return toBI(JSBI.subtract(this.jsbi, toJSBI(other)));
  }

  div(other: BIish): BI {
    return toBI(JSBI.divide(this.jsbi, toJSBI(other)));
  }

  mul(other: BIish): BI {
    return toBI(JSBI.multiply(this.jsbi, toJSBI(other)));
  }

  mod(other: BIish): BI {
    return toBI(JSBI.remainder(this.jsbi, toJSBI(other)));
  }

  abs(): BI {
    if (JSBI.greaterThanOrEqual(this.jsbi, toJSBI(0))) {
      return toBI(this.jsbi);
    } else {
      return toBI(JSBI.unaryMinus(this.jsbi));
    }
  }

  pow(other: BIish): BI {
    return toBI(JSBI.exponentiate(this.jsbi, toJSBI(other)));
  }

  and(other: BIish): BI {
    return toBI(JSBI.bitwiseAnd(this.jsbi, toJSBI(other)));
  }

  or(other: BIish): BI {
    return toBI(JSBI.bitwiseOr(this.jsbi, toJSBI(other)));
  }

  xor(other: BIish): BI {
    return toBI(JSBI.bitwiseXor(this.jsbi, toJSBI(other)));
  }

  not(): BI {
    return toBI(JSBI.bitwiseNot(this.jsbi));
  }

  mask(other: BIish): BI {
    const jsbiOther = toJSBI(other);
    if (
      JSBI.lessThan(jsbiOther, toJSBI(0)) ||
      JSBI.lessThan(this.jsbi, toJSBI(0))
    ) {
      throw new Error("mask works only with positive numbers");
    }

    const length = toJSBI(this.jsbi.toString(2).length);
    if (JSBI.lessThanOrEqual(length, jsbiOther)) {
      return toBI(this.jsbi);
    } else {
      const maskNum = JSBI.leftShift(
        JSBI.signedRightShift(this.jsbi, jsbiOther),
        jsbiOther
      );
      return toBI(JSBI.bitwiseXor(this.jsbi, maskNum));
    }
  }

  shl(other: BIish): BI {
    return toBI(JSBI.leftShift(this.jsbi, toJSBI(other)));
  }

  shr(other: BIish): BI {
    return toBI(JSBI.signedRightShift(this.jsbi, toJSBI(other)));
  }

  eq(other: BIish): boolean {
    return JSBI.equal(this.jsbi, toJSBI(other));
  }

  lt(other: BIish): boolean {
    return JSBI.lessThan(this.jsbi, toJSBI(other));
  }

  lte(other: BIish): boolean {
    return JSBI.lessThanOrEqual(this.jsbi, toJSBI(other));
  }

  gt(other: BIish): boolean {
    return JSBI.greaterThan(this.jsbi, toJSBI(other));
  }

  gte(other: BIish): boolean {
    return JSBI.greaterThanOrEqual(this.jsbi, toJSBI(other));
  }

  isNegative(): boolean {
    return JSBI.lessThan(this.jsbi, toJSBI(0));
  }

  isZero(): boolean {
    return JSBI.equal(this.jsbi, toJSBI(0));
  }

  toNumber(): number {
    return JSBI.toNumber(this.jsbi);
  }

  toBigInt(): bigint {
    try {
      return BigInt(this.jsbi.toString(10));
    } catch (e) {
      throw new Error("this platform does not support BigInt");
    }
  }

  toString(radix?: number): string {
    radix = radix || 10;
    return this.jsbi.toString(radix);
  }

  toHexString(): string {
    if (JSBI.lessThan(this.jsbi, toJSBI(0))) {
      return "-0x" + JSBI.unaryMinus(this.jsbi).toString(16);
    } else {
      return "0x" + this.jsbi.toString(16);
    }
  }

  static from(value: unknown): BI {
    if (value instanceof BI) {
      return value;
    } else if (isBIish(value)) {
      return toBI(toJSBI(value));
    } else if (value instanceof JSBI) {
      return toBI(toJSBI(value.toString()));
    } else {
      throw new Error(`invalid type: ${value} can't be converted into BI`);
    }
  }

  static isBI(value: unknown): value is BI {
    return isBILike(value) && !!value._isBI;
  }
}

function isBILike(value: unknown): value is Record<string, unknown> {
  if (value == null) return false;
  return typeof value === "object";
}

function toBI(value: JSBI): BI {
  return new BI(value);
}

export function toJSBI(value: BIish): JSBI {
  if (typeof value === "number" || typeof value === "string") {
    return JSBI.BigInt(value);
  } else {
    return JSBI.BigInt(value.toString());
  }
}

export type Unit = "shannon" | "ckb" | number;

const validUnitNames = ["shannon", "ckb"];

export const ckbDecimals = 8;

const negativeOne = BI.from(-1);

export function formatUnit(value: BIish, unit: Unit): string {
  const decimals = parseDecimals(unit);
  return formatFixed(value, decimals);
}

export function parseUnit(value: string, unit: Unit): BI {
  const decimals = parseDecimals(unit);
  return parseFixed(value, decimals);
}

function formatFixed(value: BIish, decimals: number): string {
  if (!isValidDecimalSize(decimals)) {
    throw new Error(`decimal size must be a non-negative integer`);
  }

  const multiplier = "1" + Array(decimals).fill("0").join("");

  value = BI.from(value);
  const isNegative = value.isNegative();
  if (isNegative) {
    value = value.mul(negativeOne);
  }

  const wholePart = value.div(multiplier).toString();
  let result = wholePart;
  if (multiplier.length > 1) {
    let decimalPart = value.mod(multiplier).toString();
    while (decimalPart.length < multiplier.length - 1) {
      decimalPart = "0" + decimalPart;
    }
    // remove trailing zeros
    decimalPart = decimalPart.match(/^([0-9]*[1-9]|0)(0*)/)![1];
    result += "." + decimalPart;
  }

  if (isNegative) {
    result = "-" + result;
  }

  return result;
}

function parseFixed(value: string, decimals: number): BI {
  if (!isValidDecimalSize(decimals)) {
    throw new Error(`decimal size must be a non-negative integer`);
  }

  // check if value represents a valid decimal number
  if (!value.match(/^-?\d+(\.\d{1,})?$/)) {
    throw new Error("invalid decimal string");
  }

  const multiplier = "1" + Array(decimals).fill("0").join("");

  const isNegative = value.substring(0, 1) === "-";

  if (isNegative) {
    value = value.substring(1);
  }

  let wholePart, decimalPart;
  const valueParts = value.split(".");
  if (valueParts.length === 1) {
    wholePart = valueParts[0];
    decimalPart = "0";
  } else if (valueParts.length === 2) {
    wholePart = valueParts[0];
    decimalPart = valueParts[1];
  } else {
    throw new Error("too many decimal points (should not happen)");
  }

  // remove leading zeros of whole part
  while (wholePart.length > 0 && wholePart[0] === "0") {
    wholePart = wholePart.substring(1);
  }
  if (wholePart === "") {
    wholePart = "0";
  }

  // remove trailing zeros of decimal part
  while (
    decimalPart.length > 0 &&
    decimalPart[decimalPart.length - 1] === "0"
  ) {
    decimalPart = decimalPart.substring(0, decimalPart.length - 1);
  }
  if (decimalPart.length > multiplier.length - 1) {
    throw new Error("decimal part exceeds max decimals");
  }
  if (decimalPart === "") {
    decimalPart = "0";
  }

  // pad decimal part with zeros to get to shannon
  while (decimalPart.length < multiplier.length - 1) {
    decimalPart += "0";
  }

  const wholeValue = BI.from(wholePart);
  const decimalValue = BI.from(decimalPart);

  let shannons = wholeValue.mul(multiplier).add(decimalValue);
  if (isNegative) {
    shannons = shannons.mul(negativeOne);
  }

  return shannons;
}

function parseDecimals(unit: Unit): number {
  let decimals = 0;
  if (typeof unit === "string") {
    if (validUnitNames.indexOf(unit) === -1) {
      throw new Error(
        `invalid unit name, supported names are ${validUnitNames.join(", ")}`
      );
    }
    if (unit === "ckb") {
      decimals = ckbDecimals;
    }
  } else {
    if (isValidDecimalSize(unit)) {
      decimals = unit;
    } else {
      throw new Error(`unit of integer must be a non-negative integer`);
    }
  }
  return decimals;
}

function isValidDecimalSize(decimals: number): boolean {
  return Number.isInteger(decimals) && decimals >= 0;
}
