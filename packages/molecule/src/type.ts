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
  items: (string | [string, number])[];
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
export type MolTypeMap = Record<string, MolType>;

// key is type name
export type CodecMap = Record<string, AnyCodec>;

export type ParseOptions = {
  skipDependenciesCheck?: boolean;
  refs: Record<string, AnyCodec>;
};

export interface Parser {
  parse(data: string, option?: ParseOptions): Record<string, AnyCodec>;
}

export type ParseResult = {
  code: string;
  fields: string[];
};
