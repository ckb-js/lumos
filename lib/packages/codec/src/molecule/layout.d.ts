/**
 * |  Type  |                      Header                      |               Body                |
 * |--------+--------------------------------------------------+-----------------------------------|
 * | array  |                                                  |  item-0 |  item-1 | ... |  item-N |
 * | struct |                                                  | field-0 | field-1 | ... | field-N |
 * | fixvec | items-count                                      |  item-0 |  item-1 | ... |  item-N |
 * | dynvec | full-size | offset-0 | offset-1 | ... | offset-N |  item-0 |  item-1 | ... |  item-N |
 * | table  | full-size | offset-0 | offset-1 | ... | offset-N | filed-0 | field-1 | ... | field-N |
 * | option |                                                  | item or none (zero bytes)         |
 * | union  | item-type-id                                     | item                              |
 */
import type { BytesCodec, BaseHeader, FixedBytesCodec, UnpackResult } from "../base";
declare type NullableKeys<O extends Record<string, unknown>> = {
    [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? never : K;
}[keyof O];
declare type NonNullableKeys<O extends Record<string, unknown>> = {
    [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? K : never;
}[keyof O];
declare type PartialNullable<O extends Record<string, unknown>> = Partial<Pick<O, NullableKeys<O>>> & Pick<O, NonNullableKeys<O>>;
export declare type ObjectCodec<T extends Record<string, BytesCodec>> = BytesCodec<PartialNullable<{
    [key in keyof T]: UnpackResult<T[key]>;
}>>;
export interface OptionCodec<T extends BytesCodec> extends BytesCodec<UnpackResult<T> | undefined> {
    pack: (packable?: UnpackResult<T>) => Uint8Array;
}
export declare type ArrayCodec<T extends BytesCodec> = BytesCodec<Array<UnpackResult<T>>>;
export declare type UnionCodec<T extends Record<string, BytesCodec>> = BytesCodec<{
    [key in keyof T]: {
        type: key;
        value: UnpackResult<T[key]>;
    };
}[keyof T]>;
export declare function array<T extends FixedBytesCodec>(itemCodec: T, itemCount: number): ArrayCodec<T> & BaseHeader;
export declare function struct<T extends Record<string, FixedBytesCodec>>(shape: T, fields: (keyof T)[]): ObjectCodec<T> & BaseHeader;
export declare function fixvec<T extends FixedBytesCodec>(itemCodec: T): ArrayCodec<T>;
export declare function dynvec<T extends BytesCodec>(itemCodec: T): ArrayCodec<T>;
export declare function vector<T extends BytesCodec>(itemCodec: T): ArrayCodec<T>;
export declare function table<T extends Record<string, BytesCodec>>(shape: T, fields: (keyof T)[]): ObjectCodec<T>;
export declare function union<T extends Record<string, BytesCodec>>(itemCodec: T, fields: (keyof T)[]): UnionCodec<T>;
export declare function option<T extends BytesCodec>(itemCodec: T): OptionCodec<T>;
export {};
