import {
  array,
  dynvec,
  fixvec,
  option,
  struct,
  table,
  union,
  vector,
} from "../src/molecule/layout";
import { Bytes, createFixedHexBytesCodec } from "../src/blockchain";
import { bytify } from "../src/bytes";
import test from "ava";
import { Uint16, Uint32, Uint8 } from "../src/number";
import { byteOf } from "../src/molecule";

test("test layout-array", (t) => {
  const codec = array(Uint8, 4);
  const buffer = bytify([1, 2, 3, 4]);
  const unpacked = codec.unpack(buffer);
  const packed = codec.pack(unpacked);

  t.deepEqual(unpacked, [1, 2, 3, 4]);
  t.deepEqual(packed, buffer);
});

test("test layout-struct", (t) => {
  const codec = struct(
    {
      key1: Uint8,
      key2: array(Uint8, 2),
      key3: array(Uint8, 3),
    },
    ["key1", "key2", "key3"]
  );

  const buffer = bytify([0x0, 0x1, 0x2, 0x3, 0x4, 0x5]);
  const unpacked = codec.unpack(buffer);

  t.deepEqual(unpacked, {
    key1: 0x0,
    key2: [0x1, 0x2],
    key3: [0x3, 0x4, 0x5],
  });

  t.deepEqual(codec.pack(unpacked), buffer);

  t.throws(() => {
    struct({ key1: Uint8, key2: Uint8 }, []);
  });
});

test("test layout-fixvec", (t) => {
  t.throws(() => fixvec(Uint8).unpack(Uint8Array.from([0])));
});

test("test layout-table", (t) => {
  const codec = table(
    {
      key1: fixvec(Uint8),
      key2: Uint8,
      key3: Uint32,
      key4: array(Uint8, 3),
      key5: fixvec(Uint8),
    },
    ["key1", "key2", "key3", "key4", "key5"]
  );
  // prettier-ignore
  const buffer = bytify([
        // header: total length
        0x2b, 0x00, 0x00, 0x00,
        // header: items-offsets
        0x18, 0x00, 0x00, 0x00, /* key1 */
        0x1c, 0x00, 0x00, 0x00, /* key2 */
        0x1d, 0x00, 0x00, 0x00, /* key3 */
        0x21, 0x00, 0x00, 0x00, /* key4 */
        0x24, 0x00, 0x00, 0x00, /* key5 */

        // payload
        0x00, 0x00, 0x00, 0x00, /* key1: vector(Uint8)*/
        0xab, /* key2: Uint8 */
        0x23, 0x01, 0x00, 0x00, /* key3: Uint32*/
        0x45, 0x67, 0x89, /* key4: array(Uint8, 3)*/
        0x03, 0x00, 0x00, 0x00, 0xab, 0xcd, 0xef]); /* key5: vector(Uint8) */
  const unpacked = codec.unpack(buffer);

  t.deepEqual(unpacked, {
    key1: [],
    key2: 0xab,
    key3: 0x123,
    key4: [0x45, 0x67, 0x89],
    key5: [0xab, 0xcd, 0xef],
  });

  t.deepEqual(codec.pack(unpacked), buffer);
  t.throws(() => codec.unpack(bytify([0x00, 0x00, 0x00, 0x00])));
  t.truthy(
    JSON.stringify(codec.unpack(bytify([0x04, 0x00, 0x00, 0x00]))) === "{}"
  );

  t.throws(() => {
    table({ key1: Uint8, key2: Uint8 }, []);
  });
});

test("test layout-dynvec", (t) => {
  const codec = vector(vector(Uint8));
  // prettier-ignore
  const buffer = bytify([
        // header: total length
        0x34, 0x00, 0x00, 0x00,
        // header: items-offsets
        0x18, 0x00, 0x00, 0x00, /* item 1 */
        0x1e, 0x00, 0x00, 0x00, /* item 2 */
        0x22, 0x00, 0x00, 0x00, /* item 3 */
        0x28, 0x00, 0x00, 0x00, /* item 4 */
        0x2d, 0x00, 0x00, 0x00, /* item 5 */

        // payload
        0x02, 0x00, 0x00, 0x00, 0x12, 0x34,/* item 1 , vector(uint8)*/
        0x00, 0x00, 0x00, 0x00, /* item 2 , vector(uint8）*/
        0x02, 0x00, 0x00, 0x00, 0x05, 0x67,/* item 3, vector(uint8） */
        0x01, 0x00, 0x00, 0x00, 0x89,/* item 4 , vector(uint8)*/
        0x03, 0x00, 0x00, 0x00, 0xab, 0xcd, 0xef]); /* item 5 , vector(uint8）*/
  const unpacked = codec.unpack(buffer);
  t.deepEqual(unpacked, [
    [0x12, 0x34],
    [],
    [0x05, 0x67],
    [0x89],
    [0xab, 0xcd, 0xef],
  ]);
  t.deepEqual(codec.pack(unpacked), buffer);
  t.truthy(codec.unpack(bytify([0x04, 0x00, 0x00, 0x00])).length === 0);
  t.throws(() => codec.unpack(bytify([0x34, 0x00, 0x00, 0x00])));
});
test("test layout-option", (t) => {
  const codec = option(dynvec(fixvec(Uint8)));
  // prettier-ignore
  const buffer = bytify([
        //header: total length
        0x0c, 0x00, 0x00, 0x00,
        //header: offset
        0x08, 0x00, 0x00, 0x00,
        // payload
        0x00, 0x00, 0x00, 0x00]);
  const unpacked = codec.unpack(buffer);
  t.deepEqual(unpacked, [[]]);
  t.deepEqual(codec.pack(unpacked), buffer);

  const unpackedEmpty = codec.unpack(bytify([]));
  t.deepEqual(unpackedEmpty, undefined);
  t.deepEqual(codec.pack(undefined), bytify([]));
});
test("test layout-union", (t) => {
  const codec = union(
    {
      Byte3: array(Uint8, 3),
      Bytes: fixvec(Uint8),
      BytesVec: dynvec(fixvec(Uint8)),
      BytesVecOpt: option(dynvec(fixvec(Uint8))),
    },
    ["Byte3", "Bytes", "BytesVec", "BytesVecOpt"]
  );
  // prettier-ignore
  const buffer = bytify([
        // header: item type
        0x02, 0x00, 0x00, 0x00,

        // payload
        // header: total length of payload
        0x18, 0x00, 0x00, 0x00,
        // header: items-offsets of payload
        0x0c, 0x00, 0x00, 0x00, /* item 1 */
        0x12, 0x00, 0x00, 0x00, /* item 2 */

        // payload
        0x02, 0x0, 0x00, 0x00, 0x01, 0x23,/* item 1 , vector(uint8)*/
        0x02, 0x0, 0x00, 0x00, 0x04, 0x56 /* item 2 , vector(uint8)*/
    ]);
  const unpacked = codec.unpack(buffer);
  t.deepEqual(unpacked, {
    type: "BytesVec",
    value: [
      [0x1, 0x23],
      [0x4, 0x56],
    ],
  });
  t.deepEqual(codec.pack(unpacked), buffer);
  // @ts-ignore
  t.throws(() => codec.pack({ type: "unknown", value: [] }));
});

test("test byteOf", (t) => {
  t.deepEqual(byteOf(Uint8).pack(1), bytify([1]));
  t.throws(() => byteOf(Uint16).pack(1));
});

test("test hex bytes", (t) => {
  const hexStr = "0x123456";
  const hexBytes = Bytes.pack(hexStr);
  t.deepEqual(hexBytes, bytify([0x03, 0x00, 0x00, 0x00, 0x12, 0x34, 0x56]));
  t.truthy(hexStr === Bytes.unpack(hexBytes));

  t.deepEqual(hexStr, Bytes.unpack(hexBytes));
  t.throws(() => Bytes.unpack(bytify([0x03, 0x00, 0x00, 0x00, 0x12, 0x34])));
  t.throws(() => Bytes.unpack(bytify([0x00, 0x00, 0x00])));
});

test("test fixed hex bytes", (t) => {
  const hexStr = "0x123456";
  const hexBytes = createFixedHexBytesCodec(3).pack(hexStr);
  t.deepEqual(hexBytes, bytify([0x12, 0x34, 0x56]));
  t.truthy(hexStr === createFixedHexBytesCodec(3).unpack(hexBytes));
  t.throws(() => createFixedHexBytesCodec(4).pack(hexStr));
});
