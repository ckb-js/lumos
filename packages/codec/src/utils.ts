import {
  CodecBaseParseError,
  CodecExecuteError,
  isCodecExecuteError,
} from "./error";
import { BI } from "@ckb-lumos/bi";

export type UnpackType =
  | string
  | number
  | BI
  | undefined
  | { [property: string]: UnpackType }
  | UnpackType[];

export type BITranslatedUnpackType =
  | string
  | number
  | undefined
  | { [property: string]: BITranslatedUnpackType }
  | BITranslatedUnpackType[];

export const deepTranslateBI =
  (fnName: keyof BI) =>
  (data: UnpackType): BITranslatedUnpackType => {
    if (
      Object.prototype.toString.call(data) === "[object Number]" ||
      Object.prototype.toString.call(data) === "[object String]"
    ) {
      return data as number | string;
    } else if (Object.prototype.toString.call(data) === "[object Object]") {
      const isBI = BI.isBI(data);

      if (isBI) {
        return (BI.prototype[fnName] as () => string).call(data);
      }
      const keys = Object.keys(data as Record<string, unknown>);
      let result: Record<string, unknown> = {};
      keys.forEach((key) => {
        const value = (data as Record<string, UnpackType>)[key];
        // TODO: not sure if there is a performance issue
        result = Object.assign(result, {
          [key]: deepTranslateBI(fnName)(value),
        });
      });
      return result as BITranslatedUnpackType;
    } else if (Object.prototype.toString.call(data) === "[object Array]") {
      // TODO: not sure if there is a performance issue
      return (data as BITranslatedUnpackType[]).map((item) =>
        deepTranslateBI(fnName)(item)
      );
    } else if (Object.prototype.toString.call(data) === "[object Undefined]") {
      return undefined;
    } else {
      throw new Error(
        `UnpackType should not contain types other than string|number|object|array|undefined. recieved ${JSON.stringify(
          data
        )}, type is ${Object.prototype.toString.call(data)}`
      );
    }
  };

/**
 * Unpack result is either number, string, object, or BI
 * convert { field: BI } to { field: HexString } in order to compare unpack results in tests
 *
 * e.g. { capacity: BI.from(10) } ==> { capacity: "0xa" }
 * @param data
 */
export const deepHexifyBI = deepTranslateBI("toHexString");

/**
 * Unpack result is either number, string, object, or BI
 * convert { field: BI } to { field: string } in order to compare unpack results in tests
 *
 * e.g. { capacity: BI.from(10) } ==> { capacity: "10" }
 * @param data
 */
export const deepDecimalizeBI = deepTranslateBI("toString");

const HEX_DECIMAL_REGEX = /^0x([0-9a-fA-F])+$/;
const HEX_DECIMAL_WITH_BYTELENGTH_REGEX_MAP = new Map<number, RegExp>();

export function assertHexDecimal(str: string, byteLength?: number): void {
  if (byteLength) {
    let regex = HEX_DECIMAL_WITH_BYTELENGTH_REGEX_MAP.get(byteLength);
    if (!regex) {
      const newRegex = new RegExp(`^0x([0-9a-fA-F]){1,${byteLength * 2}}$`);
      HEX_DECIMAL_WITH_BYTELENGTH_REGEX_MAP.set(byteLength, newRegex);
      regex = newRegex;
    }
    if (!regex.test(str)) {
      throw new Error("Invalid hex decimal!");
    }
  } else {
    if (!HEX_DECIMAL_REGEX.test(str)) {
      throw new Error("Invalid hex decimal!");
    }
  }
}

const HEX_STRING_REGEX = /^0x([0-9a-fA-F][0-9a-fA-F])*$/;
const HEX_STRING_WITH_BYTELENGTH_REGEX_MAP = new Map<number, RegExp>();

export function assertHexString(str: string, byteLength?: number): void {
  if (byteLength) {
    let regex = HEX_STRING_WITH_BYTELENGTH_REGEX_MAP.get(byteLength);
    if (!regex) {
      const newRegex = new RegExp(
        `^0x([0-9a-fA-F][0-9a-fA-F]){${byteLength}}$`
      );
      HEX_STRING_WITH_BYTELENGTH_REGEX_MAP.set(byteLength, newRegex);
      regex = newRegex;
    }
    if (!regex.test(str)) {
      throw new Error("Invalid hex string!");
    }
  } else {
    if (!HEX_STRING_REGEX.test(str)) {
      throw new Error("Invalid hex string!");
    }
  }
}

export function assertUtf8String(str: string): void {
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c > 0xff) {
      throw new Error("Invalid UTF-8 raw string!");
    }
  }
}

export function assertBufferLength(
  buf: { byteLength: number },
  length: number
): void {
  if (buf.byteLength !== length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be ${length}`
    );
  }
}

export function assertMinBufferLength(
  buf: { byteLength: number },
  length: number
): void {
  if (buf.byteLength < length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be at least ${length}`
    );
  }
}

export function isObjectLike(x: unknown): x is Record<string, unknown> {
  if (!x) return false;
  return typeof x === "object";
}

export function trackCodeExecuteError<T>(
  path: string | number | symbol,
  fn: () => T
): T {
  try {
    return fn();
  } catch (e) {
    const readableError = isCodecExecuteError(e)
      ? e
      : new CodecExecuteError(e as CodecBaseParseError);
    readableError.updateKey(path);
    throw readableError;
  }
}
