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

export interface Codec<Packed, Unpacked> {
  pack: (packable: Unpacked) => Packed;
  unpack: (packed: Packed) => Unpacked;
}

// export type Pack<T extends Codec<any, any>> = ReturnType<T["pack"]>;
export type Unpack<T extends Codec<any, any>> = ReturnType<T["unpack"]>;

export interface BinaryCodec<Unpacked = any>
  extends Codec<ArrayBuffer, Unpacked> {}

type Fixed = { readonly __isFixedCodec__: true };
export type FixedBinaryCodec<Unpacked = any> = BinaryCodec<Unpacked> & Fixed;

type NullableKeys<O extends Record<string, any>> = {
  [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? never : K;
}[keyof O];
type NonNullableKeys<O extends Record<string, any>> = {
  [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? K : never;
}[keyof O];
type PartialNullable<O> = Partial<Pick<O, NullableKeys<O>>> &
  Pick<O, NonNullableKeys<O>>;

export type ObjectCodec<T extends Record<string, BinaryCodec>> = BinaryCodec<
  PartialNullable<{ [key in keyof T]: Unpack<T[key]> }>
>;

export interface OptionCodec<T> extends BinaryCodec<T | undefined> {
  pack: (packable?: T) => ArrayBuffer;
}

export type ArrayCodec<T extends BinaryCodec> = BinaryCodec<Array<Unpack<T>>>;

type RecordValues<T> = T extends Record<any, infer V> ? V : never;
export type UnionCodec<T extends Record<string, BinaryCodec>> = RecordValues<
  {
    [key in keyof T]: BinaryCodec<{ type: key; value: Unpack<T[key]> }>;
  }
>;

export declare function array<T extends FixedBinaryCodec>(
  itemCodec: T,
  itemCount: number
): ArrayCodec<T> & Fixed;

export declare function struct<T extends Record<string, FixedBinaryCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> & Fixed;

declare function fixvec<T extends BinaryCodec>(itemCodec: T): ArrayCodec<T>;

declare function dynvec<T extends BinaryCodec>(itemCodec: T): ArrayCodec<T>;

export declare function vector<T extends BinaryCodec>(
  itemCodec: T
): ArrayCodec<T>;

export declare function table<T extends Record<string, BinaryCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T>;

export declare function union<T extends Record<string, BinaryCodec>>(
  itemCodec: T,
  fields: (keyof T)[]
): UnionCodec<T>;

export declare function option<T extends BinaryCodec>(
  itemCodec: T
): OptionCodec<Unpack<T>>;
