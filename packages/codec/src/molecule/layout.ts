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
} from "../base";
import { Uint32LE } from "../number";
import { concat } from "../bytes";
import { CodecBaseParseError } from "../error";
import {
  createObjectCodec,
  createArrayCodec,
  createNullableCodec,
} from "../high-order";

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

/**
 * The array is a fixed-size type: it has a fixed-size inner type and a fixed length.
 * The size of an array is the size of inner type times the length.
 * @param itemCodec the fixed-size array item codec
 * @param itemCount
 */
export function array<T extends FixedBytesCodec>(
  itemCodec: T,
  itemCount: number
): ArrayCodec<T> & Fixed {
  const enhancedArrayCodec = createArrayCodec(itemCodec);
  return createFixedBytesCodec({
    byteLength: itemCodec.byteLength * itemCount,
    pack(items) {
      const itemsBuf = enhancedArrayCodec.pack(items);
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

function checkShape<T extends object>(shape: T, fields: (keyof T)[]) {
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

/**
 * Struct is a fixed-size type: all fields in struct are fixed-size and it has a fixed quantity of fields.
 * The size of a struct is the sum of all fields' size.
 * @param shape a object contains all fields' codec
 * @param fields the shape's keys. It provide an order for serialization/deserialization.
 */
export function struct<T extends Record<string, FixedBytesCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> & Fixed {
  checkShape(shape, fields);
  const objectCodec = createObjectCodec(shape);
  return createFixedBytesCodec({
    byteLength: fields.reduce((sum, field) => sum + shape[field].byteLength, 0),
    pack(obj) {
      const packed = objectCodec.pack(
        obj as { [K in keyof T]: PackParam<T[K]> }
      );
      return fields.reduce((result, field) => {
        return concat(result, packed[field]);
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

/**
 * Vector with fixed size item codec
 * @param itemCodec fixed-size vector item codec
 */
export function fixvec<T extends FixedBytesCodec>(itemCodec: T): ArrayCodec<T> {
  return createBytesCodec({
    pack(items) {
      const arrayCodec = createArrayCodec(itemCodec);
      return concat(
        Uint32LE.pack(items.length),
        arrayCodec
          .pack(items)
          .reduce((buf, item) => concat(buf, item), new ArrayBuffer(0))
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

/**
 * Vector with dynamic size item codec
 * @param itemCodec the vector item codec. It can be fixed-size or dynamic-size.
 * For example, you can create a recursive vector with this.
 */
export function dynvec<T extends BytesCodec>(itemCodec: T): ArrayCodec<T> {
  return createBytesCodec({
    pack(obj) {
      const arrayCodec = createArrayCodec(itemCodec);
      const packed = arrayCodec.pack(obj).reduce(
        (result, item) => {
          const packedHeader = Uint32LE.pack(result.offset);
          return {
            header: concat(result.header, packedHeader),
            body: concat(result.body, item),
            offset: result.offset + item.byteLength,
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

/**
 * General vector codec, if `itemCodec` is fixed size type, it will create a fixvec codec, otherwise a dynvec codec will be created.
 * @param itemCodec
 */
export function vector<T extends BytesCodec>(itemCodec: T): ArrayCodec<T> {
  if (isFixedCodec(itemCodec)) {
    return fixvec(itemCodec);
  }
  return dynvec(itemCodec);
}

/**
 * Table is a dynamic-size type. It can be considered as a dynvec but the length is fixed.
 * @param shape The table shape, item codec can be dynamic size
 * @param fields the shape's keys. Also provide an order for pack/unpack.
 */
export function table<T extends Record<string, BytesCodec>>(
  shape: T,
  fields: (keyof T)[]
): ObjectCodec<T> {
  checkShape(shape, fields);
  return createBytesCodec({
    pack(obj) {
      const headerLength = 4 + fields.length * 4;
      const objectCodec = createObjectCodec(shape);
      const packedObj = objectCodec.pack(
        obj as { [K in keyof T]: PackParam<T[K]> }
      );
      const packed = fields.reduce(
        (result, field) => {
          const packedItem = packedObj[field];
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

/**
 * Union is a dynamic-size type.
 * Serializing a union has two steps:
 * - Serialize an item type id in bytes as a 32 bit unsigned integer in little-endian. The item type id is the index of the inner items, and it's starting at 0.
 * - Serialize the inner item.
 * @param itemCodec the union item record
 * @param fields the union item keys, can be an array or an object with custom id
 * @example
 * // without custom id
 * union({ cafe: Uint8, bee: Uint8 }, ['cafe', 'bee'])
 * // with custom id
 * union({ cafe: Uint8, bee: Uint8 }, { cafe: 0xcafe, bee: 0xbee })
 */
export function union<T extends Record<string, BytesCodec>>(
  itemCodec: T,
  fields: (keyof T)[] | Record<keyof T, number>
): UnionCodec<T> {
  checkShape(itemCodec, Array.isArray(fields) ? fields : Object.keys(fields));

  // check duplicated id
  if (!Array.isArray(fields)) {
    const ids = Object.values(fields);
    if (ids.length !== new Set(ids).size) {
      throw new Error(`Duplicated id in union: ${ids.join(", ")}`);
    }
  }

  return createBytesCodec({
    pack(obj) {
      const availableFields: (keyof T)[] = Object.keys(itemCodec);

      const type = obj.type;
      const typeName = `Union(${availableFields.join(" | ")})`;

      /* c8 ignore next */
      if (typeof type !== "string") {
        throw new CodecBaseParseError(
          `Invalid type in union, type must be a string`,
          typeName
        );
      }

      const fieldId = Array.isArray(fields)
        ? fields.indexOf(type)
        : fields[type];

      if (fieldId < 0) {
        throw new CodecBaseParseError(
          `Unknown union type: ${String(obj.type)}`,
          typeName
        );
      }
      const packedFieldIndex = Uint32LE.pack(fieldId);
      const packedBody = itemCodec[type].pack(obj.value);
      return concat(packedFieldIndex, packedBody);
    },
    unpack(buf) {
      const fieldId = Uint32LE.unpack(buf.slice(0, 4));

      const type: keyof T | undefined = (() => {
        if (Array.isArray(fields)) {
          return fields[fieldId];
        }

        const entry = Object.entries(fields).find(([, id]) => id === fieldId);
        return entry?.[0];
      })();

      if (!type) {
        throw new Error(
          `Unknown union field id: ${fieldId}, only ${fields} are allowed`
        );
      }

      return { type, value: itemCodec[type].unpack(buf.slice(4)) };
    },
  });
}

/**
 * Option is a dynamic-size type.
 * Serializing an option depends on whether it is empty or not:
 * - if it's empty, there is zero bytes (the size is 0).
 * - if it's not empty, just serialize the inner item (the size is same as the inner item's size).
 * @param itemCodec
 */
export function option<T extends BytesCodec>(itemCodec: T): OptionCodec<T> {
  return createBytesCodec({
    pack(obj?) {
      const nullableCodec = createNullableCodec(itemCodec);
      if (obj !== undefined && obj !== null) {
        return nullableCodec.pack(obj);
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
