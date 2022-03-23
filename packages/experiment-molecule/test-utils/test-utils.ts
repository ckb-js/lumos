const yaml = require("js-yaml");
const fs = require("fs");

export type TestCase = {
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
        data = testCase.data.map((d) => d.replace(/[_/]/gi, ""));
      } else if (typeof testCase.data === "object") {
        data = {};
        Object.entries(testCase.data).forEach((e) => {
          Object.assign(data as object, {
            [e[0]]: (e[1] as string).replace(/[_/]/gi, ""),
          });
        });
      }

      let caseItem: object | string | undefined = undefined;
      if (typeof testCase.item === "string") {
        caseItem = testCase.item.replace(/[_/]/gi, "")
      } else if (typeof testCase.item === "object") {
        caseItem = {};
        Object.entries(testCase.item).forEach((e) => {
          Object.assign(caseItem as object, {
            [e[0]]: (e[1] as string).replace(/[_/]/gi, ""),
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

export function buf2hex(buffer: ArrayBuffer) {
  // buffer is an ArrayBuffer
  return (
    "0x" +
    [...new Uint8Array(buffer)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}
export function hexStringToHexArray(hexStr: string) {
  if(hexStr.length % 2 !== 0 || !hexStr.startsWith("0x")) {
    throw new Error("hexStr must be a hex string");
  } else if(hexStr.length === 4) {
    return hexStr
  } else if(hexStr.length > 2) {
    return (hexStr.substring(2).match(/([0-9a-f][0-9a-f])/ig) as Array<string>).map((x) => `0x${x}`);
  }
}

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  const byteLength = hex.length / 2 - 1;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);

  for (let i = 0; i < byteLength; i++) {
    view.setUint8(i, parseInt(hex.slice(2 * i + 2, 2 * i + 4), 16));
  }
  return buffer;
}
