import test from "ava";
import {
  createArrayCodec,
  createNullableCodec,
  createObjectCodec,
  enhancePack,
} from "../src";
import { bytify } from "../src/bytes";
import { Codec } from "../src/base";
import { Uint32 } from "../src/number";

// 1 <=> "1"
const numToStr: Codec<string, number> = {
  pack: (num) => String(num),
  unpack: (str) => Number(str),
};

// "1" <=> "[1]"
const wrapBracket: Codec<string, string> = {
  pack: (unwrapped) => `[${unwrapped}]`,
  unpack: (wrapped) => wrapped.slice(1, -1),
};

test("should pack to a string object and unpack to a number object when using createObjectCodec<numToStr>", (t) => {
  const codec = createObjectCodec({ n1: numToStr, n2: numToStr });
  const unpacked = { n1: 1, n2: 2 };
  const packed = { n1: "1", n2: "2" };

  t.deepEqual(packed, codec.pack(unpacked));
  t.deepEqual(unpacked, codec.unpack(packed));
});

test("should pack to a string array and unpack to a number array when using createArrayCodec<numToStr>", (t) => {
  const codec = createArrayCodec(numToStr);
  const unpacked = [1, 2];
  const packed = ["1", "2"];

  t.deepEqual(packed, codec.pack(unpacked));
  t.deepEqual(unpacked, codec.unpack(packed));
});

test("should be wrapped with brackets after the codec is enhanced", (t) => {
  // 1 <=> "[1]"
  const wrap1 = enhancePack(numToStr, wrapBracket.pack, wrapBracket.unpack);

  t.is("[1]", wrap1.pack(1));
  t.is(1, wrap1.unpack("[1]"));

  // 1 <=> "[[1]]"
  const wrap2 = enhancePack(wrap1, wrapBracket.pack, wrapBracket.unpack);
  t.is("[[1]]", wrap2.pack(1));
  t.is(1, wrap2.unpack("[[1]]"));
});

test("createNullableCodec should works as expected", (t) => {
  const codec = createNullableCodec(Uint32);

  t.is(codec.pack(undefined), undefined);
  t.is(codec.unpack(undefined), undefined);

  t.deepEqual(codec.pack(0x12345678), bytify([0x78, 0x56, 0x34, 0x12]));
  t.deepEqual(codec.unpack([0x78, 0x56, 0x34, 0x12]), 0x12345678);
});
