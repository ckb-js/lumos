import { AnyCodec } from "@ckb-lumos/codec/lib/base";
export const byte = "byte";

export type BaseType = {
  name: string;
  item: string;
};

export type Field = {
  name: string;
  type: string;
};

export type Array = {
  type: "array";
  item_count: number;
} & BaseType;

export type Vector = {
  type: "vector";
} & BaseType;

export type Option = {
  type: "option";
} & BaseType;

export type Union = {
  type: "union";
  name: string;
  items: string[];
};

export type Struct = {
  type: "struct";
  name: string;
  fields: Field[];
};

export type Table = {
  type: "table";
  name: string;
  fields: Field[];
};

// mol types
export type MolType = Array | Vector | Option | Union | Struct | Table;

// key is type name
export type MolTypeMap = Map<string, MolType>;

// key is type name
export type CodecMap = Map<string, AnyCodec>;


export type ParseOptions = {
  skipDependenciesCheck: boolean;
};

export interface Parser {
  parse(data: string, options: ParseOptions): MolType[];
}
