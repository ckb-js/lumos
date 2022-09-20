import { MolType, MolTypeMap } from "./type";

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
