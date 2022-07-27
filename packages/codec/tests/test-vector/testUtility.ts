import { array, option, struct, table, union, vector } from "../../src/molecule";
import { BytesCodec, FixedBytesCodec } from "../../src/base";
import { bytify } from "../../src/bytes";

const yaml = require("js-yaml");
const fs = require("fs");

type ArrayTestMetadata = {
  type: "array";
  itemCount: number;
  itemCodec: FixedBytesCodec;
};

type ObjectTestMetadata = {
  type: "struct" | "table" | "union";
  itemCodecs: Array<[string, BytesCodec]>;
};

type VectorOrOptionTestMetadata = {
  type: "option" | "vector";
  itemCodec: BytesCodec;
};

type ByteTestMetadata = {
  type: "byte";
};

export type TestMetadata = ArrayTestMetadata | ObjectTestMetadata | VectorOrOptionTestMetadata | ByteTestMetadata;
export type TestBytesCodec = BytesCodec & { testMetadata: TestMetadata };
export type FixedTestBytesCodec = FixedBytesCodec & {
  testMetadata: TestMetadata;
};

export const testArray = (itemCodec: FixedBytesCodec, itemCount: number): FixedTestBytesCodec => {
  const codec = array(itemCodec, itemCount);
  return {
    testMetadata: {
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
    testMetadata: {
      type: name,
      itemCodecs: Object.entries(shape).map(([field, codec]) => [field, codec]),
    },
    ...codec,
  };
};
export const testStruct = (shape: Record<string, FixedBytesCodec>, fields: Array<string>) => {
  const codec = struct(shape, fields);
  return (testObject("struct", codec, shape) as unknown) as FixedTestBytesCodec;
};
export const testUnion = (shape: Record<string, BytesCodec>, fields: Array<string>) => {
  const codec = union(shape, fields);
  return testObject("union", codec, shape);
};
export const testTable = (shape: Record<string, BytesCodec>, fields: Array<string>) => {
  const codec = table(shape, fields);
  return testObject("table", codec, shape);
};
export const testVector = (itemCodec: BytesCodec): TestBytesCodec => {
  const codec = vector(itemCodec);
  return {
    testMetadata: {
      type: "vector",
      itemCodec,
    },
    ...codec,
  };
};
export const testOption = (itemCodec: BytesCodec): TestBytesCodec => {
  const codec = option(itemCodec);
  return {
    testMetadata: {
      type: "option",
      itemCodec,
    },
    ...codec,
  };
};

export function generateDefaultCodecData(codec: any): any {
  const testMetadata = codec.testMetadata;
  if (testMetadata.type === "array") {
    return new Array(testMetadata.itemCount).fill(generateDefaultCodecData(testMetadata.itemCodec));
  }
  if (testMetadata.type === "struct" || testMetadata.type === "table") {
    const defaultValue = {};
    (testMetadata.itemCodecs as Array<[string, BytesCodec]>).forEach(([field, codec]) => {
      Object.assign(defaultValue, {
        [field]: generateDefaultCodecData(codec),
      });
    });
    return defaultValue;
  }
  if (testMetadata.type === "option") {
    return undefined;
  }
  if (testMetadata.type === "union") {
    const itemCodec = testMetadata.itemCodecs[0];
    return {
      type: itemCodec[0],
      value: generateDefaultCodecData(itemCodec[1]),
    };
  }
  if (testMetadata.type === "vector") {
    return [];
  }
  if (testMetadata.type === "byte") {
    return 0;
  }
}

export function fullfillPartialCodecData(codec: any, data: any, item: any): any {
  const defaultData = generateDefaultCodecData(codec);
  const testMetadata = codec.testMetadata;
  if (testMetadata.type === "array") {
    const fulfilledData = defaultData;
    Object.entries(data).forEach(([index, value]) => {
      fulfilledData[(index as any) as number] = value;
    });
    return fulfilledData;
  }
  if (testMetadata.type === "struct" || testMetadata.type === "table") {
    const fulfilledData = defaultData;
    Object.entries(data).forEach(([key, value]) => {
      const itemCodec = (testMetadata.itemCodecs as Array<[string, BytesCodec]>).find(([field]) => field === key)![1];
      fulfilledData[key] = itemCodec.unpack(bytify(value as any));
    });
    return fulfilledData;
  }
  if (testMetadata.type === "option") {
    return codec.unpack(bytify(item));
  }
  if (testMetadata.type === "union") {
    const itemCodec = (testMetadata.itemCodecs as Array<[string, BytesCodec]>).find(
      ([field]) => field === item.type
    )![1];
    const fulfilledData = itemCodec.unpack(bytify(item.data));
    return {
      type: item.type,
      value: fulfilledData,
    };
  }
  if (testMetadata.type === "vector") {
    return (data as Array<string>).map((line) => testMetadata.itemCodec.unpack(bytify(line)));
  }
  if (testMetadata.type === "byte") {
    return 0;
  }
}

type TestCase = {
  name: string;
  data?: any;
  item?: any;
  expected: string;
};

export const loadTests = (path: string): Array<TestCase> => {
  let cases: Array<TestCase> = [];
  try {
    cases = yaml.load(fs.readFileSync(`${process.cwd()}/tests/test-vector/${path}`, "utf8"));
  } catch (e) {
    console.log(e);
  }
  cases = cases.map((testCase) => {
    let data: object | string[] | undefined = undefined;
    if (Array.isArray(testCase.data)) {
      data = testCase.data.map((dataItem) => dataItem.replace(/[_/]/gi, ""));
    } else if (typeof testCase.data === "object") {
      data = {};
      Object.entries(testCase.data).forEach((testCaseDataEntry) => {
        Object.assign(data as object, {
          [testCaseDataEntry[0]]: (testCaseDataEntry[1] as string).replace(/[_/]/gi, ""),
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
          [testCaseItemEntry[0]]: (testCaseItemEntry[1] as string).replace(/[_/]/gi, ""),
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

  return cases;
};
