import {
  array,
  option,
  struct,
  table,
  union,
  vector,
  FixedBytesCodec,
  BytesCodec,
} from "@ckb-lumos/experiment-codec";
import { toArrayBuffer } from "../../src/utils";
const yaml = require("js-yaml");
const fs = require("fs");

type ArrayTestMetaData = {
  type: "array";
  itemCount: number;
  itemCodec: FixedBytesCodec;
};

type ObjectTestMetaData = {
  type: "struct" | "table" | "union";
  itemCodecs: Array<[string, BytesCodec]>;
};

type VectorOrOptionTestMetaData = {
  type: "option" | "vector";
  itemCodec: BytesCodec;
};

type ByteTestMetaData = {
  type: "byte";
};

export type TestMetaData =
  | ArrayTestMetaData
  | ObjectTestMetaData
  | VectorOrOptionTestMetaData
  | ByteTestMetaData;
export type TestBytesCodec = BytesCodec & { testMetaData: TestMetaData };
export type FixedTestBytesCodec = FixedBytesCodec & {
  testMetaData: TestMetaData;
};

export const testArray = (
  itemCodec: FixedBytesCodec | FixedBytesCodec,
  itemCount: number
): FixedTestBytesCodec => {
  const codec = array(itemCodec, itemCount);
  return {
    testMetaData: {
      type: "array",
      itemCount,
      itemCodec: itemCodec,
    },
    ...codec,
  };
};
const testObject = (
  name: "struct" | "table" | "union",
  codec: BytesCodec,
  shape: Record<string, BytesCodec>
): TestBytesCodec => {
  return {
    testMetaData: {
      type: name,
      itemCodecs: Object.entries(shape).map(([field, codec]) => [field, codec]),
    },
    ...codec,
  };
};
export const testStruct = (
  shape: Record<string, FixedBytesCodec>,
  fields: Array<string>
) => {
  const codec = struct(shape, fields);
  return (testObject("struct", codec, shape) as unknown) as FixedTestBytesCodec;
};
export const testUnion = (
  shape: Record<string, BytesCodec>,
  fields: Array<string>
) => {
  const codec = union(shape, fields);
  return testObject("union", codec, shape);
};
export const testTable = (
  shape: Record<string, BytesCodec>,
  fields: Array<string>
) => {
  const codec = table(shape, fields);
  return testObject("table", codec, shape);
};
export const testVector = (itemCodec: BytesCodec): TestBytesCodec => {
  const codec = vector(itemCodec);
  return {
    testMetaData: {
      type: "vector",
      itemCodec,
    },
    ...codec,
  };
};
export const testOption = (itemCodec: BytesCodec): TestBytesCodec => {
  const codec = option(itemCodec);
  return {
    testMetaData: {
      type: "option",
      itemCodec,
    },
    ...codec,
  };
};

export function generateDefaultCodecData(codec: any): any {
  const testMetaData = codec.testMetaData;
  if (testMetaData.type === "array") {
    return new Array(testMetaData.itemCount).fill(
      generateDefaultCodecData(testMetaData.itemCodec)
    );
  }
  if (testMetaData.type === "struct" || testMetaData.type === "table") {
    const defaultValue = {};
    (testMetaData.itemCodecs as Array<[string, BytesCodec]>).forEach(
      ([field, codec]) => {
        Object.assign(defaultValue, {
          [field]: generateDefaultCodecData(codec),
        });
      }
    );
    return defaultValue;
  }
  if (testMetaData.type === "option") {
    return undefined;
  }
  if (testMetaData.type === "union") {
    const itemCodec = testMetaData.itemCodecs[0];
    return {
      type: itemCodec[0],
      value: generateDefaultCodecData(itemCodec[1]),
    };
  }
  if (testMetaData.type === "vector") {
    return [];
  }
  if (testMetaData.type === "byte") {
    return 0;
  }
}

export function fullfillPartialCodecData(
  codec: any,
  data: any,
  item: any
): any {
  const defaultData = generateDefaultCodecData(codec);
  const testMetaData = codec.testMetaData;
  if (testMetaData.type === "array") {
    const fulfilledData = defaultData;
    Object.entries(data).forEach(([index, value]) => {
      fulfilledData[(index as any) as number] = value;
    });
    return fulfilledData;
  }
  if (testMetaData.type === "struct" || testMetaData.type === "table") {
    const fulfilledData = defaultData;
    Object.entries(data).forEach(([key, value]) => {
      const itemCodec = (testMetaData.itemCodecs as Array<
        [string, BytesCodec]
      >).find(([field]) => field === key)![1];
      fulfilledData[key] = itemCodec.unpack(toArrayBuffer(value as any));
    });
    return fulfilledData;
  }
  if (testMetaData.type === "option") {
    return codec.unpack(toArrayBuffer(item));
  }
  if (testMetaData.type === "union") {
    const itemCodec = (testMetaData.itemCodecs as Array<
      [string, BytesCodec]
    >).find(([field]) => field === item.type)![1];
    const fulfilledData = itemCodec.unpack(toArrayBuffer(item.data));
    return {
      type: item.type,
      value: fulfilledData,
    };
  }
  if (testMetaData.type === "vector") {
    return (data as Array<string>).map((line) =>
      testMetaData.itemCodec.unpack(toArrayBuffer(line))
    );
  }
  if (testMetaData.type === "byte") {
    return 0;
  }
}

type TestCase = {
  name: string;
  data?: any;
  item?: any;
  expected: string;
};

export const loadTests = (path: string) => {
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
