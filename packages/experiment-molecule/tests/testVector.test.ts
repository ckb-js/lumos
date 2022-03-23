import test from "ava";
import {
  buf2hex,
  loadTests,
  hexStringToHexArray,
  hexToArrayBuffer,
} from "../test-utils/test-utils";
import * as schema from "./test-vector/schema";
import * as defaultTestDataMap from "./test-vector/type-defaults";

const simpleTests = loadTests("simple.yaml");
simpleTests.forEach((testCase, tag) => {
  const testName = testCase.name;
  // Byte Codecs
  if (testName.match(/^Byte\d*$|^Word$/)) {
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    let testData = defaultTestDataMap[testName];
    if (testCase.data) {
      Object.entries(testCase.data).forEach((e) => {
        // @ts-ignore
        testData[e[0]] = e[1];
      });
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${testData}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName.match(/^Struct\w{1}$|StructIx3/)) {
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    let testData = { ...defaultTestDataMap[testName] };
    if (testCase.data) {
      Object.entries(testCase.data).forEach((e) => {
        // @ts-ignore
        testData[e[0]] = hexStringToHexArray(e[1]);
      });
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${testData}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName.match(/^Bytes$|^Words$|^Byte3Vec$|^Byte7Vec$/)) {
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    let testData = [...defaultTestDataMap[testName]];
    if (testCase.data) {
      testData = testCase.data.map(hexStringToHexArray);
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${testData}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName.match(/(Struct[IJKP]|Bytes|Words|ByteOpt)Vec$/)) {
    //  @ts-ignore
    const itemCodecName = testName.match(
      /(Struct[IJKP]|Bytes|Words|ByteOpt)Vec$/
    )[1];
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    const itemCodec: any = schema[itemCodecName];
    //  @ts-ignore
    let testData = [...defaultTestDataMap[testName]];

    if (
      testCase.data &&
      Array.isArray(testCase.data) &&
      testCase.data.length > 0
    ) {
      //  @ts-ignore
      testData = testCase.data.map((item) => {
        const hexArray = hexToArrayBuffer(item);
        return itemCodec.unpack(hexArray);
      });
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${JSON.stringify(
          testData
        )}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName === "Table5") {
    // table Table5 {
    //     f1: byte,
    //     f2: Word2,
    //     f3: StructA,
    //     f4: Bytes,
    //     f5: BytesVec,
    // }
    const itemCodecMap = {
      f1: schema.byte,
      f2: schema.Word2,
      f3: schema.StructA,
      f4: schema.Bytes,
      f5: schema.BytesVec,
    };
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    let testData = { ...defaultTestDataMap[testName] };
    if (testCase.data) {
      //  @ts-ignore
      Object.entries(testCase.data).forEach((e) => {
        // @ts-ignore
        testData[e[0]] = itemCodecMap[e[0]].unpack(hexToArrayBuffer(e[1]));
      });
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${JSON.stringify(
          testData
        )}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName === "TableA") {
    //   table TableA {
    //     f1: Word2,
    //     f2: StructA,
    //     f3: Bytes,
    //     f4: BytesVec,
    //     f5: Table1,
    //     f6: BytesOpt,
    //     f7: UnionA,
    //     f8: byte,
    // }
    const itemCodecMap = {
      f1: schema.Word2,
      f2: schema.StructA,
      f3: schema.Bytes,
      f4: schema.BytesVec,
      f5: schema.Table1,
      f6: schema.BytesOpt,
      f7: schema.UnionA,
      f8: schema.byte,
    };
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    let testData = { ...defaultTestDataMap[testName] };
    if (testCase.data) {
      //  @ts-ignore
      Object.entries(testCase.data).forEach((e) => {
        // @ts-ignore
        testData[e[0]] = itemCodecMap[e[0]].unpack(hexToArrayBuffer(e[1]));
      });
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${JSON.stringify(
          testData
        )}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName.match(/Opt$/)) {
    // option ByteOpt (byte);
    // option WordOpt (Word);
    // option StructAOpt (StructA);
    // option StructPOpt (StructP);
    // option BytesOpt (Bytes);
    // option WordsOpt (Words);
    // option BytesVecOpt (BytesVec);
    // option WordsVecOpt (WordsVec);
    // option Table0Opt (Table0);
    // option Table6Opt (Table6);
    // option Table6OptOpt (Table6Opt);
    const itemCodecMap = {
      ByteOpt: schema.byte,
      WordOpt: schema.Word,
      StructAOpt: schema.StructA,
      StructPOpt: schema.StructP,
      BytesOpt: schema.Bytes,
      WordsOpt: schema.Words,
      BytesVecOpt: schema.BytesVec,
      WordsVecOpt: schema.WordsVec,
      Table0Opt: schema.Table0,
      Table6Opt: schema.Table6,
      Table6OptOpt: schema.Table6Opt,
    };
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    const itemCodec = itemCodecMap[testName];
    //  @ts-ignore
    let testData = testCase.item;
    if (testData) {
      testData = itemCodec.unpack(hexToArrayBuffer(testCase.item));
    }
    const packed = codec.pack(testData);
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${JSON.stringify(
          testData
        )}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else if (testName === "UnionA") {
    // union UnionA {
    //     byte,
    //     Word,
    //     StructA,
    //     Bytes,
    //     Words,
    //     Table0,
    //     Table6,
    //     Table6Opt,
    // }
    const itemCodecMap = {
      byte: schema.byte,
      Word: schema.Word,
      StructA: schema.StructA,
      Bytes: schema.Bytes,
      Words: schema.Words,
      Table0: schema.Table0,
      Table6: schema.Table6,
      Table6Opt: schema.Table6Opt,
    };
    //  @ts-ignore
    const codec: any = schema[testName];
    //  @ts-ignore
    const itemCodec = itemCodecMap[testCase.item.type];
    //  @ts-ignore
    let testData = itemCodec.unpack(hexToArrayBuffer(testCase.item.data));
    const packed = codec.pack({ type: testCase.item.type, value: testData });
    test.serial(
      `Byte codec: ${testName}, tag: ${tag},\n
        codec is: ${JSON.stringify(codec)}, \n
        testData: ${JSON.stringify(
          testData
        )}, packed: ${packed},  is running...`,
      (t) => {
        t.deepEqual(buf2hex(packed), testCase.expected);
      }
    );
  } else {
    console.warn(`WARNING: ${testName} is not tested`);
  }
});
