import test from "ava";
import { array, struct } from "../src/layout";
import { Uint8 } from "../src/common";
import { createBuffer } from "../src/utils";

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
