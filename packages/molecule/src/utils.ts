import { MolType, MolTypeMap } from "./type";
import { BI } from "@ckb-lumos/bi";

type UnpackType =
  | string
  | number
  | BI
  | undefined
  | { [property: string]: UnpackType }
  | UnpackType[];

type BIHexifiedFUnpackType =
  | string
  | number
  | undefined
  | { [property: string]: BIHexifiedFUnpackType }
  | BIHexifiedFUnpackType[];

/**
 * Unpack result is either number, string, object, or BI
 * convert { field: BI } to { field: HexString } in order to compare unpack results in tests
 *
 * eg: { capacity: BI.from(10) } ==> { capacity: "0xa" }
 * @param data
 */
export const deepHexifyBI = (data: UnpackType): BIHexifiedFUnpackType => {
  if (
    Object.prototype.toString.call(data) === "[object Number]" ||
    Object.prototype.toString.call(data) === "[object String]"
  ) {
    return data as number | string;
  } else if (Object.prototype.toString.call(data) === "[object Object]") {
    const isBI = BI.isBI(data);

    if (isBI) {
      return (data as BI).toHexString();
    }
    const keys = Object.keys(data as Record<string, unknown>);
    let result: Record<string, unknown> = {};
    keys.forEach((key) => {
      const value = (data as Record<string, UnpackType>)[key];
      result = Object.assign(result, { [key]: deepHexifyBI(value) });
    });
    return result as BIHexifiedFUnpackType;
  }
};

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
