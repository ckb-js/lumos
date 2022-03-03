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

import { Uint32LE } from "./common";
import { concatBuffer } from "./utils";

export interface Codec<Packed, Unpacked> {
  pack: (packable: Unpacked) => Packed;
  unpack: (packed: Packed) => Unpacked;
}

// export type Pack<T extends Codec<any, any>> = ReturnType<T["pack"]>;
export type Unpack<T extends Codec<any, any>> = ReturnType<T["unpack"]>;

export interface BinaryCodec<Unpacked = any>
  extends Codec<ArrayBuffer, Unpacked> {}

type Fixed = { readonly __isFixedCodec__: true; readonly byteLength: number };
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

export const byte: FixedBinaryCodec<ArrayBuffer> = {
  __isFixedCodec__: true,
  byteLength: 1,
  pack(buf) {
    return buf;
  },
  unpack(buf) {
    return buf;
  },
};

export function array<T extends FixedBinaryCodec>(
  itemCodec: T,
  itemCount: number
): ArrayCodec<T> & Fixed {
  return Object.freeze({
    __isFixedCodec__: true,
    byteLength: itemCodec.byteLength * itemCount,
    pack(items) {
      return items.reduce(
        (buf, item) => concatBuffer(buf, itemCodec.pack(item)),
        new ArrayBuffer(0)
      );
    },
    unpack(buf) {
      const itemSize = buf.byteLength / itemCount;
      const result: Unpack<T>[] = [];
      for (let i = 0; i < itemCount; i++) {
        result.push(itemCodec.unpack(buf.slice(i, i + itemSize)));
      }
      return result;
    },
  });
}

export function struct<T extends Record<string, FixedBinaryCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> & Fixed {
  return {
    __isFixedCodec__: true,
    byteLength: fields.reduce((sum, field) => sum + shape[field].byteLength, 0),
    pack(obj) {
      return fields.reduce((result, field) => {
        const itemCodec = shape[field];

        // @ts-ignore
        const item = obj[field];
        return concatBuffer(result, itemCodec.pack(item));
      }, new ArrayBuffer(0));
    },
    unpack(buf) {
      let offset = 0;
      return fields.reduce((obj, field) => {
        const itemCodec = shape[field];
        const itemBuf = buf.slice(offset, offset + itemCodec.byteLength);

        Object.assign(obj, { [field]: itemCodec.unpack(itemBuf) });
        offset += itemCodec.byteLength;

        return obj;
      }, {} as PartialNullable<{ [key in keyof T]: Unpack<T[key]> }>);
    },
  };
}

export function fixvec<T extends BinaryCodec>(itemCodec: T): ArrayCodec<T> {
  return {
    pack(items) {
      return concatBuffer(
        Uint32LE.pack(items.length),
        items.reduce(
          (buf, item) => concatBuffer(buf, itemCodec.pack(item)),
          new ArrayBuffer(0)
        )
      );
    },
    unpack(buf) {
      const itemCount = Uint32LE.unpack(buf.slice(0, 4));
      const itemSize = (buf.byteLength - 4) / itemCount;
      return array(
        { ...itemCodec, __isFixedCodec__: true, byteLength: itemSize },
        itemCount
      ).unpack(buf.slice(4));
    },
  };
}

export function dynvec<T extends BinaryCodec>(itemCodec: T): ArrayCodec<T> {
  return {
    pack(obj) {
      const packed = obj.reduce(
        (result, item) => {
          const packedItem = itemCodec.pack(item);
          const packedHeader = Uint32LE.pack(packedItem.byteLength);
          return [
            concatBuffer(result[0], packedHeader),
            concatBuffer(result[1], packedItem),
          ];
        },
        [new ArrayBuffer(0), new ArrayBuffer(0)]
      );
      const packedTotalSize = Uint32LE.pack(
        packed[0].byteLength + packed[1].byteLength + 4
      );
      return concatBuffer(packedTotalSize, packed[0], packed[1]);
    },
    unpack(buf) {
      const totalSize = Uint32LE.unpack(buf.slice(0, 4));
      const result: any = [];
      if (totalSize <= 4) {
        return result;
      } else {
        const offset0 = Uint32LE.unpack(buf.slice(4, 8));
        const itemCount = (offset0 - 4) / 4;
        const offsets = new Array(itemCount)
          .fill(1)
          .map((_, index) =>
            Uint32LE.unpack(buf.slice(4 + index * 4, 8 + index * 4))
          );
        offsets.push(totalSize);
        const result = [];
        for (let index = 0; index < offsets.length - 1; index++) {
          const start = offsets[index];
          const end = offsets[index + 1];
          const itemBuf = buf.slice(start, end);
          result.push(itemCodec.unpack(itemBuf));
        }
        return result;
      }
    },
  };
}

export function vector<T extends BinaryCodec>(itemCodec: T): ArrayCodec<T> {
  return {
    pack(items) {
      const length = items.length;
      const packedLength = Uint32LE.pack(length);
      const packedBody = items.reduce(
        (buf, item) => concatBuffer(buf, itemCodec.pack(item)),
        new ArrayBuffer(0)
      );
      return concatBuffer(packedLength, packedBody);
    },
    unpack(buf) {
      const itemCount = Uint32LE.unpack(buf.slice(0, 4));
      if (itemCount === 0) {
        return [];
      }
      const itemSize = (buf.byteLength - 4) / itemCount;
      const result: Unpack<T>[] = [];
      for (let i = 0; i < itemCount; i++) {
        result.push(itemCodec.unpack(buf.slice(i, i + itemSize)));
      }
      return result;
    },
  };
}

export function table<T extends Record<string, BinaryCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> {
  return {
    pack(obj) {
      const packed = fields.reduce(
        (result, field) => {
          const itemCodec = shape[field];
          // @ts-ignore
          const item = obj[field];
          const packedItem = itemCodec.pack(item);
          const packedHeader = Uint32LE.pack(packedItem.byteLength);
          return [
            concatBuffer(result[0], packedHeader),
            concatBuffer(result[1], packedItem),
          ];
        },
        [new ArrayBuffer(0), new ArrayBuffer(0)]
      );
      const packedTotalSize = Uint32LE.pack(
        packed[0].byteLength + packed[1].byteLength + 4
      );
      return concatBuffer(packedTotalSize, packed[0], packed[1]);
    },
    unpack(buf) {
      const totalSize = Uint32LE.unpack(buf.slice(0, 4));
      if (totalSize <= 4 || fields.length === 0) {
        return {} as PartialNullable<{ [key in keyof T]: Unpack<T[key]> }>;
      } else {
        const offsets = fields.map((_, index) =>
          Uint32LE.unpack(buf.slice(4 + index * 4, 8 + index * 4))
        );
        offsets.push(totalSize);
        const obj = {};
        for (let index = 0; index < offsets.length - 1; index++) {
          const start = offsets[index];
          const end = offsets[index + 1];
          const field = fields[index];
          const itemCodec = shape[field];
          const itemBuf = buf.slice(start, end);
          Object.assign(obj, { [field]: itemCodec.unpack(itemBuf) });
        }
        return obj as PartialNullable<{ [key in keyof T]: Unpack<T[key]> }>;
      }
    },
  };
}

export function union<T extends Record<string, BinaryCodec>>(
  itemCodec: T,
  fields: (keyof T)[]
): UnionCodec<T> {
  return {
    pack(
      obj: RecordValues<
        { [key in keyof T]: { type: key; value: ReturnType<T[key]["unpack"]> } }
      >
    ) {
      const type = (obj as any).type;
      const fieldIndex = fields.indexOf(type);
      if (fieldIndex === -1) {
        throw new Error(`Unknown union type: ${(obj as any).type}`);
      }
      const packedFieldIndex = Uint32LE.pack(fieldIndex);
      const packedBody = itemCodec[type].pack((obj as any).value);
      return concatBuffer(packedFieldIndex, packedBody);
    },
    unpack(buf: ArrayBuffer) {
      const typeIndex = Uint32LE.unpack(buf.slice(0, 4));
      const type = fields[typeIndex];
      return { type, value: itemCodec[type].unpack(buf.slice(4)) };
    },
  } as RecordValues<
    {
      [key in keyof T]: BinaryCodec<{
        type: key;
        value: ReturnType<T[key]["unpack"]>;
      }>;
    }
  >;
}

export function option<T extends BinaryCodec>(
  itemCodec: T
): OptionCodec<Unpack<T>> {
  return {
    pack(obj?) {
      if (obj) {
        return itemCodec.pack(obj);
      } else {
        return new ArrayBuffer(0);
      }
    },
    unpack(buf) {
      if (buf.byteLength === 0) {
        return null;
      }
      return itemCodec.unpack(buf);
    },
  };
}
