import test from "ava";
import { array, struct } from "../src/layout";
import { byte } from "../src/common";

test("test layout-array", (t) => {
  const codec = array(byte, 4);
  const buffer = Uint8Array.from([1, 2, 3, 4]).buffer;
  const unpacked = codec.unpack(buffer);

  t.deepEqual(unpacked, [1, 2, 3, 4]);
});

test("test layout-struct", (t) => {
  const codec = struct(
    {
      key1: byte,
      key2: array(byte, 2),
      key3: array(byte, 3),
    },
    ["key1", "key2", "key3"]
  );

  const buffer = Uint8Array.from([0x0, 0x1, 0x2, 0x3, 0x4, 0x5]).buffer;
  const unpacked = codec.unpack(buffer);

  t.deepEqual(unpacked, {
    key1: 0x0,
    key2: [0x1, 0x2],
    key3: [0x3, 0x4, 0x5],
  });
});
