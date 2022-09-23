import { MolType, MolTypeMap } from "./type";

// TODO: assert not null/undefined
export function nonNull(data: unknown): void {
  if (!data) {
    throw new Error(`${data} does not exist.`);
  }
}

export const toMolTypeMap = (results: MolType[]): MolTypeMap => {
  const map: MolTypeMap = {};
  results.forEach((result) => {
    map[result.name] = result;
  });
  return map;
};
