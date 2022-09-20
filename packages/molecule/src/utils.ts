import { MolType, MolTypeMap } from "./type";
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
export const deepNumerifyBI = deepTranslateBI("toString");

// TODO: assert not null/undefined
export function nonNull(data: unknown): void {
  if (!data) {
    throw new Error(`${data} does not exist.`);
  }
}

export const toMolTypeMap = (results: MolType[]): MolTypeMap => {
  const map = new Map<string, MolType>();
  results.forEach((result) => {
    map.set(result.name, result);
  });
  return map;
};
