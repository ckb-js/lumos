import test from "ava";
import { codecs } from "./test-vector/codecs";
import { defaultTestDataMap } from "./test-vector/type-defaults";
import { BytesCodec } from "@ckb-lumos/experiment-codec";
import { toArrayBuffer, toHex } from "../src/utils";
const yaml = require("js-yaml");
const fs = require("fs");

type TestCase = {
  name: string;
  data?: any;
  item?: any;
  expected: string;
};

const loadTests = (path: string) => {
  let cases: Array<TestCase> = [];
  try {
    cases = yaml.load(
      fs.readFileSync(`${process.cwd()}/tests/test-vector/${path}`, "utf8")
    );
    console.log(`Read ${cases.length} test cases from file:`, path);
    cases = cases.map((testCase) => {
      let data: object | string[] | undefined = undefined;
      if (Array.isArray(testCase.data)) {
        data = testCase.data.map((dataItem) => dataItem.replace(/[_/]/gi, ""));
      } else if (typeof testCase.data === "object") {
        data = {};
        Object.entries(testCase.data).forEach((testCaseDataEntry) => {
          Object.assign(data as object, {
            [testCaseDataEntry[0]]: (testCaseDataEntry[1] as string).replace(
              /[_/]/gi,
              ""
            ),
          });
        });
      }
      let caseItem: object | string | undefined = undefined;
      if (typeof testCase.item === "string") {
        caseItem = testCase.item.replace(/[_/]/gi, "");
      } else if (typeof testCase.item === "object") {
        caseItem = {};
        Object.entries(testCase.item).forEach((testCaseItemEntry) => {
          Object.assign(caseItem as object, {
            [testCaseItemEntry[0]]: (testCaseItemEntry[1] as string).replace(
              /[_/]/gi,
              ""
            ),
          });
        });
      }
      return {
        name: testCase.name,
        data,
        item: caseItem,
        expected: testCase.expected.replace(/[_/]/gi, ""),
      };
    });
  } catch (e) {
    console.log(e);
  }
  return cases;
};

function hexStringToHexArray(hexStr: string) {
  if (hexStr.length % 2 !== 0 || !hexStr.startsWith("0x")) {
    throw new Error("hexStr must be a hex string");
  } else if (hexStr.length === 4) {
    return hexStr;
  } else if (hexStr.length > 2) {
    return (hexStr.substring(2).match(/([0-9a-f][0-9a-f])/gi) as Array<
      string
    >).map((x) => `0x${x}`);
  }
}

const simpleTests = loadTests("simple.yaml");
simpleTests.forEach((testCase, index) => {
  const testName = testCase.name;
  const codec: BytesCodec = codecs[testName];
  let testData = clone(defaultTestDataMap[testName]);

  // Byte Codecs
  if (testName.match(/^Byte\d*$|^Word$/)) {
    if (testCase.data) {
      testData = fillArrayWithDefault(testCase.data, testData as Array<any>);
    }
  } else if (testName.match(/^Struct\w{1}$|StructIx3/)) {
    if (testCase.data) {
      testData = fillObjectWithDefault(testCase.data, testData);
    }
  } else if (testName.match(/^Bytes$|^Words$|^Byte3Vec$|^Byte7Vec$/)) {
    if (testCase.data) {
      testData = testCase.data.map(hexStringToHexArray);
    }
  } else if (testName.match(/(Struct[IJKP]|Bytes|Words|ByteOpt)Vec$/)) {
    const matches = testName.match(/(Struct[IJKP]|Bytes|Words|ByteOpt)Vec$/);
    assertNonNull(matches);
    const itemCodecName = matches[1];
    const itemCodec: BytesCodec = codecs[itemCodecName];
    if (testCase.data) {
      testData = testCase.data.map((item: string) =>
        itemCodec.unpack(toArrayBuffer(item))
      );
    }
  } else if (testName === "Table5" || testName === "TableA") {
    // table Table5 {
    //     f1: byte,
    //     f2: Word2,
    //     f3: StructA,
    //     f4: Bytes,
    //     f5: BytesVec,
    // }
    const itemCodecTable5Map: Record<string, BytesCodec> = {
      f1: codecs.byte,
      f2: codecs.Word2,
      f3: codecs.StructA,
      f4: codecs.Bytes,
      f5: codecs.BytesVec,
    };
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
    const itemCodecTableAMap: Record<string, BytesCodec> = {
      f1: codecs.Word2,
      f2: codecs.StructA,
      f3: codecs.Bytes,
      f4: codecs.BytesVec,
      f5: codecs.Table1,
      f6: codecs.BytesOpt,
      f7: codecs.UnionA,
      f8: codecs.byte,
    };

    if (testCase.data) {
      Object.entries(testCase.data).forEach((testDataEntry) => {
        const [itemCodecName, itemValue] = testDataEntry;
        let itemCodec: BytesCodec;
        if (testName === "Table5") {
          itemCodec = itemCodecTable5Map[itemCodecName];
        } else if (testName === "TableA") {
          itemCodec = itemCodecTableAMap[itemCodecName];
        } else {
          throw new Error("Not implemented test case.");
        }
        (testData as Record<string, object>)[itemCodecName] = itemCodec.unpack(
          toArrayBuffer(itemValue as string)
        );
      });
    }
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
    const itemCodecMap: Record<string, BytesCodec> = {
      ByteOpt: codecs.byte,
      WordOpt: codecs.Word,
      StructAOpt: codecs.StructA,
      StructPOpt: codecs.StructP,
      BytesOpt: codecs.Bytes,
      WordsOpt: codecs.Words,
      BytesVecOpt: codecs.BytesVec,
      WordsVecOpt: codecs.WordsVec,
      Table0Opt: codecs.Table0,
      Table6Opt: codecs.Table6,
      Table6OptOpt: codecs.Table6Opt,
    };
    const itemCodec = itemCodecMap[testName];
    testData = testCase.item;
    if (testCase.item) {
      testData = itemCodec.unpack(toArrayBuffer(testCase.item));
    }
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
    const itemCodecMap: Record<string, BytesCodec> = {
      byte: codecs.byte,
      Word: codecs.Word,
      StructA: codecs.StructA,
      Bytes: codecs.Bytes,
      Words: codecs.Words,
      Table0: codecs.Table0,
      Table6: codecs.Table6,
      Table6Opt: codecs.Table6Opt,
    };
    const itemCodec = itemCodecMap[testCase.item.type];
    testData = itemCodec.unpack(toArrayBuffer(testCase.item.data));
    testData = { type: testCase.item.type, value: testData };
  } else {
    console.warn(`WARNING: ${testName} is not tested`);
  }
  const packed = codec.pack(testData);
  test(`should same with expected when packing No.${index} data in simple.yaml`, (t) => {
    t.deepEqual(toHex(packed), testCase.expected);
  });
});

function clone(data: object | Array<any>): object | Array<any> {
  if (Array.isArray(data)) {
    return [...data];
  } else {
    return { ...data };
  }
}

function fillObjectWithDefault(
  partialData: object,
  defaultData: Record<string, any>
) {
  const fulfilledData = defaultData;
  Object.entries(partialData).forEach((partialDataEntry) => {
    fulfilledData[partialDataEntry[0]] = hexStringToHexArray(
      partialDataEntry[1]
    );
  });
  return fulfilledData;
}

function fillArrayWithDefault(
  partialData: Array<any>,
  defaultData: Array<any>
) {
  const fulfilledData = defaultData;
  Object.entries(partialData).forEach((partialDataEntry) => {
    fulfilledData[(partialDataEntry[0] as any) as number] = partialDataEntry[1];
  });
  return fulfilledData;
}

function assertNonNull<T>(arg: T): asserts arg is NonNullable<T> {
  if (arg === null) {
    throw new Error("arg is null");
  }
}
