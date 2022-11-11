import { MolType, MolTypeMap } from "./type";

export function nonNull<T>(data: T): asserts data is NonNullable<T> {
  if (data === null || data === undefined) throw new Error("NonNullable");
}

export const toMolTypeMap = (results: MolType[]): MolTypeMap => {
  const map: MolTypeMap = {};
  results.forEach((result) => {
    map[result.name] = result;
  });
  return map;
};
