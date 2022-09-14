import { AnyCodec } from "@ckb-lumos/codec/lib/base";
export declare const byte = "byte";
export declare type BaseType = {
    name: string;
    item: string;
};
export declare type Field = {
    name: string;
    type: string;
};
export declare type Array = {
    type: "array";
    item_count: number;
} & BaseType;
export declare type Vector = {
    type: "vector";
} & BaseType;
export declare type Option = {
    type: "option";
} & BaseType;
export declare type Union = {
    type: "union";
    name: string;
    items: string[];
};
export declare type Struct = {
    type: "struct";
    name: string;
    fields: Field[];
};
export declare type Table = {
    type: "table";
    name: string;
    fields: Field[];
};
export declare type MolType = Array | Vector | Option | Union | Struct | Table;
export declare type MolTypeMap = Map<string, MolType>;
export declare type CodecMap = Map<string, AnyCodec>;
export interface Parser {
    parse(data: string): MolType[];
}
