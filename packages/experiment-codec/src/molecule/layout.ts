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

import type { BinaryCodec, Fixed, FixedBinaryCodec, Unpacked } from "../base";
import { createFixedCodec, isFixedCodec } from "../base";
import { Uint32LE } from "../number";
import { concatBuffer } from "../utils";

type NullableKeys<O extends Record<string, unknown>> = {
  [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? never : K;
}[keyof O];
type NonNullableKeys<O extends Record<string, unknown>> = {
  [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? K : never;
}[keyof O];

type PartialNullable<O extends Record<string, unknown>> = Partial<
  Pick<O, NullableKeys<O>>
> &
  Pick<O, NonNullableKeys<O>>;

export type ObjectCodec<T extends Record<string, BinaryCodec>> = BinaryCodec<
  PartialNullable<{ [key in keyof T]: Unpacked<T[key]> }>
>;

export interface OptionCodec<T extends BinaryCodec>
  extends BinaryCodec<Unpacked<T> | undefined> {
  pack: (packable?: ReturnType<T["unpack"]>) => ArrayBuffer;
}

export type ArrayCodec<T extends BinaryCodec> = BinaryCodec<Array<Unpacked<T>>>;

export type UnionCodec<T extends Record<string, BinaryCodec>> = BinaryCodec<
  { [key in keyof T]: { type: key; value: Unpacked<T[key]> } }[keyof T]
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
      const itemsBuf = items.map((item) => itemCodec.pack(item));
      return concatBuffer(...itemsBuf);
    },
    unpack(buf) {
      const result: Unpacked<T>[] = [];
      const itemLength = itemCodec.byteLength;
      for (let offset = 0; offset < buf.byteLength; offset += itemLength) {
        result.push(itemCodec.unpack(buf.slice(offset, offset + itemLength)));
      }
      return result;
    },
  });
}

export function struct<T extends Record<string, FixedBinaryCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> & Fixed {
  return createFixedCodec({
    byteLength: fields.reduce((sum, field) => sum + shape[field].byteLength, 0),
    pack(obj) {
      return fields.reduce((result, field) => {
        const itemCodec = shape[field];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const item = obj[field];
        return concatBuffer(result, itemCodec.pack(item));
      }, new ArrayBuffer(0));
    },
    unpack(buf) {
      const result = {} as PartialNullable<
        { [key in keyof T]: Unpacked<T[key]> }
      >;
      let offset = 0;

      fields.forEach((field) => {
        const itemCodec = shape[field];
        const itemBuf = buf.slice(offset, offset + itemCodec.byteLength);
        Object.assign(result, { [field]: itemCodec.unpack(itemBuf) });

        offset = offset + itemCodec.byteLength;
      });

      return result;
    },
  });
}

export function fixvec<T extends FixedBinaryCodec>(
  itemCodec: T
): ArrayCodec<T> {
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
      if (buf.byteLength < 4) {
        throw new Error(
          `fixvec: buffer is too short, expected at least 4 bytes, got ${buf.byteLength}`
        );
      }
      const itemCount = Uint32LE.unpack(buf.slice(0, 4));
      return array(itemCodec, itemCount).unpack(buf.slice(4));
    },
  };
}

export function dynvec<T extends BinaryCodec>(itemCodec: T): ArrayCodec<T> {
  return {
    pack(obj) {
      const packed = obj.reduce(
        (result, item) => {
          const packedItem = itemCodec.pack(item);
          const packedHeader = Uint32LE.pack(result.offset);
          return {
            header: concatBuffer(result.header, packedHeader),
            body: concatBuffer(result.body, packedItem),
            offset: result.offset + packedItem.byteLength,
          };
        },
        {
          header: new ArrayBuffer(0),
          body: new ArrayBuffer(0),
          offset: 4 + obj.length * 4,
        }
      );
      const packedTotalSize = Uint32LE.pack(
        packed.header.byteLength + packed.body.byteLength + 4
      );
      return concatBuffer(packedTotalSize, packed.header, packed.body);
    },
    unpack(buf) {
      const totalSize = Uint32LE.unpack(buf.slice(0, 4));
      if (totalSize !== buf.byteLength) {
        throw new Error(
          `Invalid buffer size, read from header: ${totalSize}, actual: ${buf.byteLength}`
        );
      }
      const result: Unpacked<T>[] = [];
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
        const result: Unpacked<T>[] = [];
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
  if (isFixedCodec(itemCodec)) {
    return fixvec(itemCodec);
  }
  return dynvec(itemCodec);
}

export function table<T extends Record<string, BinaryCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> {
  return {
    pack(obj) {
      const headerLength = 4 + fields.length * 4;
      const packed = fields.reduce(
        (result, field) => {
          const itemCodec = shape[field];
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const item = obj[field];
          const packedItem = itemCodec.pack(item);
          const packedOffset = Uint32LE.pack(result.offset);
          return {
            header: concatBuffer(result.header, packedOffset),
            body: concatBuffer(result.body, packedItem),
            offset: result.offset + packedItem.byteLength,
          };
        },
        {
          header: new ArrayBuffer(0),
          body: new ArrayBuffer(0),
          offset: headerLength,
        }
      );
      const packedTotalSize = Uint32LE.pack(
        packed.header.byteLength + packed.body.byteLength + 4
      );
      return concatBuffer(packedTotalSize, packed.header, packed.body);
    },
    unpack(buf) {
      const totalSize = Uint32LE.unpack(buf.slice(0, 4));
      if (totalSize !== buf.byteLength) {
        throw new Error(
          `Invalid buffer size, read from header: ${totalSize}, actual: ${buf.byteLength}`
        );
      }
      if (totalSize <= 4 || fields.length === 0) {
        return {} as PartialNullable<{ [key in keyof T]: Unpacked<T[key]> }>;
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
        return obj as PartialNullable<{ [key in keyof T]: Unpacked<T[key]> }>;
      }
    },
  };
}

export function union<T extends Record<string, BinaryCodec>>(
  itemCodec: T,
  fields: (keyof T)[]
): UnionCodec<T> {
  return {
    pack(obj) {
      const type = obj.type;
      const fieldIndex = fields.indexOf(type);
      if (fieldIndex === -1) {
        throw new Error(`Unknown union type: ${obj.type}`);
      }
      const packedFieldIndex = Uint32LE.pack(fieldIndex);
      const packedBody = itemCodec[type].pack(obj.value);
      return concatBuffer(packedFieldIndex, packedBody);
    },
    unpack(buf: ArrayBuffer) {
      const typeIndex = Uint32LE.unpack(buf.slice(0, 4));
      const type = fields[typeIndex];
      return { type, value: itemCodec[type].unpack(buf.slice(4)) };
    },
  };
}

export function option<T extends BinaryCodec>(itemCodec: T): OptionCodec<T> {
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
        return undefined;
      }
      return itemCodec.unpack(buf);
    },
  };
}
