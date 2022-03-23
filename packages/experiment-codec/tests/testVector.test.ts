import test from "ava";
import * as schema from "./test-vector/schema";
import * as defaultTestDataMap from "./test-vector/type-defaults";
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
simpleTests.forEach((testCase, tag) => {
  const testName = testCase.name;
  //  @ts-ignore
  const codec: BytesCodec = schema[testName];
  //  @ts-ignore
  let testData = copyDefaultData(defaultTestDataMap[testName]);

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
    //  @ts-ignore
    const itemCodecName = testName.match(
      /(Struct[IJKP]|Bytes|Words|ByteOpt)Vec$/
    )[1];
    //  @ts-ignore
    const itemCodec: BytesCodec = schema[itemCodecName];
    if (testCase.data) {
      //  @ts-ignore
      testData = testCase.data.map((item) =>
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
    const itemCodecTable5Map = {
      f1: schema.byte,
      f2: schema.Word2,
      f3: schema.StructA,
      f4: schema.Bytes,
      f5: schema.BytesVec,
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
    const itemCodecTableAMap = {
      f1: schema.Word2,
      f2: schema.StructA,
      f3: schema.Bytes,
      f4: schema.BytesVec,
      f5: schema.Table1,
      f6: schema.BytesOpt,
      f7: schema.UnionA,
      f8: schema.byte,
    };

    if (testCase.data) {
      //  @ts-ignore
      Object.entries(testCase.data).forEach((testDataEntry) => {
        const [itemCodecName, itemValue] = testDataEntry;
        let itemCodec: BytesCodec;
        if (testName === "Table5") {
          // @ts-ignore
          itemCodec = itemCodecTable5Map[itemCodecName];
        } else if (testName === "TableA") {
          // @ts-ignore
          itemCodec = itemCodecTableAMap[itemCodecName];
        } else {
          throw new Error("Not implemented test case.");
        }
        // @ts-ignore
        testData[itemCodecName] = itemCodec.unpack(toArrayBuffer(itemValue));
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
    const itemCodec = itemCodecMap[testName];
    //  @ts-ignore
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
    const itemCodec = itemCodecMap[testCase.item.type];
    //  @ts-ignore
    testData = itemCodec.unpack(toArrayBuffer(testCase.item.data));
    testData = { type: testCase.item.type, value: testData };
  } else {
    console.warn(`WARNING: ${testName} is not tested`);
  }
  const packed = codec.pack(testData);
  test.serial(
    `TestName: ${testName}, No.${tag}:\n 
    Test case is: ${JSON.stringify(testCase)}\n 
    Unpacked: ${JSON.stringify(testData)}\n`,
    (t) => {
      t.deepEqual(toHex(packed), testCase.expected);
    }
  );
});

function copyDefaultData(data: object | Array<any>): object | Array<any> {
  if (Array.isArray(data)) {
    return [...data];
  } else {
    return { ...data };
  }
}

function fillObjectWithDefault(partialData: object, defaultData: object) {
  const fulfilledData = defaultData;
  Object.entries(partialData).forEach((partialDataEntry) => {
    // @ts-ignore
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
    // @ts-ignore
    fulfilledData[partialDataEntry[0]] = partialDataEntry[1];
  });
  return fulfilledData;
}
