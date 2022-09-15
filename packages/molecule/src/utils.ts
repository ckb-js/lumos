import { MolType, MolTypeMap } from "./type";
import { BI } from "@ckb-lumos/bi";

type UnpackType =
  | string
  | number
  | BI
  | undefined
  | { [property: string]: UnpackType }
  | UnpackType[];

/**
 * Unpack result is either number, string, object, or BI
 * convert { field: BI } to { field: HexString } in order to compare unpack results in tests
 *
 * eg: { capacity: BI.from(10) } ==> { capacity: "0xa" }
 * @param data
 */
export const deepHexifyBI = (data: UnpackType) => {
  if (
    Object.prototype.toString.call(data) === "[object Number]" ||
    Object.prototype.toString.call(data) === "[object String]"
  ) {
    return data;
  } else if (Object.prototype.toString.call(data) === "[object Object]") {
    const isBI = BI.isBI(data);

    if (isBI) {
      return (data as BI).toHexString();
    }
    const keys = Object.keys(data as any);
    let result: object = {};
    keys.forEach((key) => {
      const value = (data as Record<string, UnpackType>)[key];
      result = Object.assign(result, { [key]: deepHexifyBI(value) });
    });
    return result;
  }
};

// TODO: assert not null/undefined
export function nonNull(data: any) {
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
