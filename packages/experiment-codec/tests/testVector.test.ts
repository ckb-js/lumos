import test from "ava";
import { BytesCodec } from "@ckb-lumos/experiment-codec";
import { codecs } from "./test-vector/codecs";
import { toArrayBuffer } from "../src/utils";
import {
  loadTests,
  generateDefaultCodecData,
  fullfillPartialCodecData,
} from "./test-vector/testUtility";

function codecWithDefaultData(codec: BytesCodec) {
  return codec.pack(generateDefaultCodecData(codec));
}

function codecWithPartialData(codec: BytesCodec, data: any, item: any) {
  return codec.pack(fullfillPartialCodecData(codec, data, item));
}

test("should generateDefaultCodecData work as expected", (t) => {
  t.deepEqual(generateDefaultCodecData(codecs.Byte2), new Array(2).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte3), new Array(3).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte4), new Array(4).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte5), new Array(5).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte6), new Array(6).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte7), new Array(7).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte8), new Array(8).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte9), new Array(9).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte10), new Array(10).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte11), new Array(11).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte12), new Array(12).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte13), new Array(13).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte14), new Array(14).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte15), new Array(15).fill(0));
  t.deepEqual(generateDefaultCodecData(codecs.Byte16), new Array(16).fill(0));

  t.deepEqual(generateDefaultCodecData(codecs.Word), new Array(2).fill(0));
  t.deepEqual(
    generateDefaultCodecData(codecs.Word2),
    new Array(2).fill(new Array(2).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Word3),
    new Array(3).fill(new Array(2).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Word4),
    new Array(4).fill(new Array(2).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Word5),
    new Array(5).fill(new Array(2).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Word6),
    new Array(6).fill(new Array(2).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Word7),
    new Array(7).fill(new Array(2).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Word8),
    new Array(8).fill(new Array(2).fill(0))
  );

  t.deepEqual(
    generateDefaultCodecData(codecs.Byte3x3),
    new Array(3).fill(new Array(3).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Byte5x3),
    new Array(3).fill(new Array(5).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Byte7x3),
    new Array(3).fill(new Array(7).fill(0))
  );
  t.deepEqual(
    generateDefaultCodecData(codecs.Byte9x3),
    new Array(3).fill(new Array(9).fill(0))
  );
  // struct StructA {
  //     f1: byte,
  //     f2: byte,
  //     f3: Byte2,
  //     f4: Byte2,
  // }
  t.deepEqual(generateDefaultCodecData(codecs.StructA), {
    f1: 0,
    f2: 0,
    f3: new Array(2).fill(0),
    f4: new Array(2).fill(0),
  });
  // struct StructI {
  //     f1: Byte3,
  //     f2: byte,
  // }
  t.deepEqual(
    generateDefaultCodecData(codecs.StructIx3),
    new Array(3).fill({ f1: new Array(3).fill(0), f2: 0 })
  );
  // struct StructJ {
  //     f1: Byte6,
  //     f2: byte,
  // }
  // struct StructP {
  //     f1: StructJ,
  //     f2: byte,
  // }
  t.deepEqual(generateDefaultCodecData(codecs.StructP), {
    f1: { f1: new Array(6).fill(0), f2: 0 },
    f2: 0,
  });
  t.deepEqual(generateDefaultCodecData(codecs.Bytes), []);
  t.deepEqual(generateDefaultCodecData(codecs.Table0), {});
  t.deepEqual(generateDefaultCodecData(codecs.ByteOpt), undefined);
  t.deepEqual(generateDefaultCodecData(codecs.UnionA), {
    type: "byte",
    value: 0,
  });
});

const defaultTestCases = loadTests("default.yaml");
test("default.yaml", (t) => {
  t.is(defaultTestCases.length, 72);
  defaultTestCases.forEach(({ name, expected }) => {
    const codec = codecs[name];
    t.deepEqual(codecWithDefaultData(codec), toArrayBuffer(expected));
  });
});

const simpleTestCases = loadTests("simple.yaml");
test("simple.yaml", (t) => {
  t.is(simpleTestCases.length, 63);
  simpleTestCases.forEach(({ name, expected, data, item }) => {
    const codec = codecs[name];
    t.deepEqual(
      codecWithPartialData(codec, data, item),
      toArrayBuffer(expected)
    );
  });
});
