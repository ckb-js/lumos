import { array, dynvec, fixvec, option, struct, table, union } from "../src/layout";
import { createBuffer } from "../src/utils";
// import { BI } from "@ckb-lumos/BI";
import test from "ava";
import { Uint32, Uint8 } from "../src/common";

test("test layout-array", (t) => {
  const codec = array(Uint8, 4);
  const buffer = createBuffer([1, 2, 3, 4]);
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

  const buffer = createBuffer([0x0, 0x1, 0x2, 0x3, 0x4, 0x5]);
  const unpacked = codec.unpack(buffer);

  t.deepEqual(unpacked, {
    key1: 0x0,
    key2: [0x1, 0x2],
    key3: [0x3, 0x4, 0x5],
  });

  t.deepEqual(codec.pack(unpacked), buffer);
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

  const buffer = createBuffer([0x2b, 0x00, 0x00, 0x00,
    0x18, 0x00, 0x00, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x1d, 0x00, 0x00, 0x00, 0x21, 0x00, 0x00, 0x00, 0x24, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00,
    0xab,
    0x23, 0x01, 0x00, 0x00,
    0x45, 0x67, 0x89,
    0x03, 0x00, 0x00, 0x00, 0xab, 0xcd, 0xef]);
  const unpacked = codec.unpack(buffer);

  t.deepEqual(unpacked, {
    key1: [],
    key2: 0xab,
    key3: 0x123,
    key4: [0x45, 0x67, 0x89],
    key5: [0xab, 0xcd, 0xef],
  });

  t.deepEqual(codec.pack(unpacked), buffer);
});
test("test layout-dynvec", (t) => {
  const codec = dynvec(fixvec(Uint8));

  const buffer = createBuffer([0x34, 0x00, 0x00, 0x00,
    0x18, 0x00, 0x00, 0x00, 0x1e, 0x00, 0x00, 0x00, 0x22, 0x00, 0x00, 0x00, 0x28, 0x00, 0x00, 0x00, 0x2d, 0x00, 0x00, 0x00,
    0x02, 0x00, 0x00, 0x00, 0x12, 0x34,
    0x00, 0x00, 0x00, 0x00, 
    0x02, 0x00, 0x00, 0x00, 0x05, 0x67,
    0x01, 0x00, 0x00, 0x00, 0x89,
    0x03, 0x00, 0x00, 0x00, 0xab, 0xcd, 0xef]);
  const unpacked = codec.unpack(buffer);
  t.deepEqual(unpacked, [[0x12, 0x34], [], [0x05, 0x67], [0x89], [0xab, 0xcd, 0xef]]);
  t.deepEqual(codec.pack(unpacked), buffer);
});
test("test layout-option", (t) => {
  const codec = option(dynvec(fixvec(Uint8)));

  const buffer = createBuffer([0x0c, 0x00, 0x00, 0x00,
    0x08, 0x00, 0x00, 0x00, 
    0x00, 0x00, 0x00, 0x00]);
  const unpacked = codec.unpack(buffer);
  t.deepEqual(unpacked, [[]]);
  t.deepEqual(codec.pack(unpacked), buffer);

  const unpackedEmpty = codec.unpack(new ArrayBuffer(0));
  t.deepEqual(unpackedEmpty, undefined);
  t.deepEqual(codec.pack(undefined), new ArrayBuffer(0));
});
test("test layout-union", (t) => {
  const codec = union({ "Byte3": array(Uint8, 3), "Bytes": fixvec(Uint8), 
  "BytesVec": dynvec(fixvec(Uint8)), "BytesVecOpt": option(dynvec(fixvec(Uint8))) },
  ["Byte3", "Bytes", "BytesVec", "BytesVecOpt"]);

  const buffer = createBuffer([0x02, 0x00, 0x00, 0x00,
    0x18, 0x00, 0x00, 0x00, 
    0x0c, 0x00, 0x00, 0x00, 0x12, 0x00, 0x00, 0x00,
    0x02, 0x0, 0x00, 0x00, 0x01, 0x23,
    0x02, 0x0, 0x00, 0x00, 0x04, 0x56]);
  const unpacked = codec.unpack(buffer);
  t.deepEqual(unpacked, { type: "BytesVec", value: [[0x1,0x23], [0x4, 0x56]] });
  t.deepEqual(codec.pack(unpacked as any), buffer);
});