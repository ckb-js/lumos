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

import {
  BytesCodec,
  Fixed,
  FixedBytesCodec,
  PackParam,
  UnpackResult,
  createBytesCodec,
  createFixedBytesCodec,
  isFixedCodec,
  CodecBaseParseError,
} from "../base";
import { Uint32LE } from "../number";
import { concat } from "../bytes";

type NullableKeys<O extends Record<string, unknown>> = {
  [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? never : K;
}[keyof O];
type NonNullableKeys<O extends Record<string, unknown>> = {
  [K in keyof O]-?: [O[K] & (undefined | null)] extends [never] ? K : never;
}[keyof O];

// prettier-ignore
type PartialNullable<O extends Record<string, unknown>> =
  & Partial<Pick<O, NullableKeys<O>>>
  & Pick<O, NonNullableKeys<O>>;

export type ObjectCodec<T extends Record<string, BytesCodec>> = BytesCodec<
  PartialNullable<{ [key in keyof T]: UnpackResult<T[key]> }>,
  PartialNullable<{ [key in keyof T]: PackParam<T[key]> }>
>;

export interface OptionCodec<T extends BytesCodec>
  extends BytesCodec<UnpackResult<T> | undefined> {
  pack: (packable?: PackParam<T>) => Uint8Array;
}

export type ArrayCodec<T extends BytesCodec> = BytesCodec<
  Array<UnpackResult<T>>,
  Array<PackParam<T>>
>;

export type UnionCodec<T extends Record<string, BytesCodec>> = BytesCodec<
  { [key in keyof T]: { type: key; value: UnpackResult<T[key]> } }[keyof T],
  { [key in keyof T]: { type: key; value: PackParam<T[key]> } }[keyof T]
>;

export function array<T extends FixedBytesCodec>(
  itemCodec: T,
  itemCount: number
): ArrayCodec<T> & Fixed {
  return createFixedBytesCodec({
    byteLength: itemCodec.byteLength * itemCount,
    pack(items) {
      const itemsBuf = items.map((item) => itemCodec.pack(item));
      return concat(...itemsBuf);
    },
    unpack(buf) {
      const result: UnpackResult<T>[] = [];
      const itemLength = itemCodec.byteLength;
      for (let offset = 0; offset < buf.byteLength; offset += itemLength) {
        result.push(itemCodec.unpack(buf.slice(offset, offset + itemLength)));
      }
      return result;
    },
  });
}

function diff(x1: unknown[], x2: unknown[]) {
  return x1.filter((x) => !x2.includes(x));
}

function checkShape<T>(shape: T, fields: (keyof T)[]) {
  const shapeKeys = Object.keys(shape) as (keyof T)[];

  const missingFields = diff(shapeKeys, fields);
  const missingShape = diff(fields, shapeKeys);

  if (missingFields.length > 0 || missingShape.length > 0) {
    throw new Error(
      `Invalid shape: missing fields ${missingFields.join(
        ", "
      )} or shape ${missingShape.join(", ")}`
    );
  }
}

export function struct<T extends Record<string, FixedBytesCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> & Fixed {
  checkShape(shape, fields);

  return createFixedBytesCodec({
    byteLength: fields.reduce((sum, field) => sum + shape[field].byteLength, 0),
    pack(obj) {
      return fields.reduce((result, field) => {
        const itemCodec = shape[field];

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const item = obj[field];
        return concat(result, itemCodec.pack(item));
      }, Uint8Array.from([]));
    },
    unpack(buf) {
      const result = {} as PartialNullable<{
        [key in keyof T]: UnpackResult<T[key]>;
      }>;
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

export function fixvec<T extends FixedBytesCodec>(itemCodec: T): ArrayCodec<T> {
  return createBytesCodec({
    pack(items) {
      return concat(
        Uint32LE.pack(items.length),
        items.reduce(
          (buf, item) => concat(buf, itemCodec.pack(item)),
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
  });
}

export function dynvec<T extends BytesCodec>(itemCodec: T): ArrayCodec<T> {
  return createBytesCodec({
    pack(obj) {
      const packed = obj.reduce(
        (result, item) => {
          const packedItem = itemCodec.pack(item);
          const packedHeader = Uint32LE.pack(result.offset);
          return {
            header: concat(result.header, packedHeader),
            body: concat(result.body, packedItem),
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
      return concat(packedTotalSize, packed.header, packed.body);
    },
    unpack(buf) {
      const totalSize = Uint32LE.unpack(buf.slice(0, 4));
      if (totalSize !== buf.byteLength) {
        throw new Error(
          `Invalid buffer size, read from header: ${totalSize}, actual: ${buf.byteLength}`
        );
      }
      const result: UnpackResult<T>[] = [];
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
        const result: UnpackResult<T>[] = [];
        for (let index = 0; index < offsets.length - 1; index++) {
          const start = offsets[index];
          const end = offsets[index + 1];
          const itemBuf = buf.slice(start, end);
          result.push(itemCodec.unpack(itemBuf));
        }
        return result;
      }
    },
  });
}

export function vector<T extends BytesCodec>(itemCodec: T): ArrayCodec<T> {
  if (isFixedCodec(itemCodec)) {
    return fixvec(itemCodec);
  }
  return dynvec(itemCodec);
}

export function table<T extends Record<string, BytesCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> {
  checkShape(shape, fields);
  return createBytesCodec({
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
            header: concat(result.header, packedOffset),
            body: concat(result.body, packedItem),
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
      return concat(packedTotalSize, packed.header, packed.body);
    },
    unpack(buf) {
      const totalSize = Uint32LE.unpack(buf.slice(0, 4));
      if (totalSize !== buf.byteLength) {
        throw new Error(
          `Invalid buffer size, read from header: ${totalSize}, actual: ${buf.byteLength}`
        );
      }
      if (totalSize <= 4 || fields.length === 0) {
        return {} as PartialNullable<{
          [key in keyof T]: UnpackResult<T[key]>;
        }>;
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
        return obj as PartialNullable<{
          [key in keyof T]: UnpackResult<T[key]>;
        }>;
      }
    },
  });
}

export function union<T extends Record<string, BytesCodec>>(
  itemCodec: T,
  fields: (keyof T)[]
): UnionCodec<T> {
  return createBytesCodec({
    pack(obj) {
      const type = obj.type;
      const typeName = `union(${fields.join(" | ")})`;

      /* c8 ignore next */
      if (typeof type !== "string") {
        throw new Error(`Invalid type in union, type must be a string`);
      }

      const fieldIndex = fields.indexOf(type);
      if (fieldIndex === -1) {
        throw new CodecBaseParseError(
          `Unknown union type: ${String(obj.type)}`,
          typeName
        );
      }
      const packedFieldIndex = Uint32LE.pack(fieldIndex);
      const packedBody = itemCodec[type].pack(obj.value);
      return concat(packedFieldIndex, packedBody);
    },
    unpack(buf) {
      const typeIndex = Uint32LE.unpack(buf.slice(0, 4));
      const type = fields[typeIndex];
      return { type, value: itemCodec[type].unpack(buf.slice(4)) };
    },
  });
}

export function option<T extends BytesCodec>(itemCodec: T): OptionCodec<T> {
  return createBytesCodec({
    pack(obj?) {
      if (obj !== undefined && obj !== null) {
        return itemCodec.pack(obj);
      } else {
        return Uint8Array.from([]);
      }
    },
    unpack(buf) {
      if (buf.byteLength === 0) {
        return undefined;
      }
      return itemCodec.unpack(buf);
    },
  });
}
