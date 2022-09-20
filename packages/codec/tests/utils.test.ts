import test from "ava";
import {
  assertHexDecimal,
  assertHexString,
  isObjectLike,
  deepHexifyBI,
  deepDecimalizeBI,
} from "../src/utils";
import { bytify } from "../src/bytes";
import { BI } from "@ckb-lumos/lumos";

test("test codec", (t) => {
  const tx = {
    version: "0x0",
    cellDeps: [
      {
        depType: "code",
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: BI.from("0x0"),
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: BI.from("0x10"),
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: BI.from("0x2"),
        },
      },
    ],
    outputs: [
      {
        capacity: BI.from("0x1234"),
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data",
        },
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  };
  t.deepEqual(deepHexifyBI(tx), {
    version: "0x0",
    cellDeps: [
      {
        depType: "code",
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: "0x0",
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: "0x10",
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: "0x2",
        },
      },
    ],
    outputs: [
      {
        capacity: "0x1234",
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data",
        },
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  });

  t.deepEqual(deepDecimalizeBI(tx), {
    version: "0x0",
    cellDeps: [
      {
        depType: "code",
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: "0",
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: "16",
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: "2",
        },
      },
    ],
    outputs: [
      {
        capacity: "4660",
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data",
        },
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  });
});

test("should assertHexString fail", (t) => {
  t.throws(() => assertHexString("00"));
  t.throws(() => assertHexString("0x01020304", 8));
});
test("should assertHexString pass", (t) => {
  t.notThrows(() => assertHexString("0x01020304", 4));
});
test("should assertHexDecimal fail", (t) => {
  t.throws(() => assertHexDecimal("0x"));
  t.throws(() => assertHexDecimal("0x123", 1));
  t.notThrows(() => assertHexDecimal("0x0"));
  t.notThrows(() => assertHexDecimal("0x12", 1));
});

function toNumberArray(x: Uint8Array | number[]): number[] {
  return Array.from(x);
}

test("should return the expected ArrayBuffer when calling toArrayBuffer()", (t) => {
  const testCase0 = new ArrayBuffer(1);
  const testCase1 = new Uint8Array([1, 2]);
  const testCase2 = "0x0304";
  const testCase3 = [1, 2, 3, 4];
  const testCase4 = { length: 8 };

  t.deepEqual(toNumberArray(bytify(testCase0)), [0]);
  t.deepEqual(toNumberArray(bytify(testCase1)), [1, 2]);
  t.deepEqual(toNumberArray(bytify(testCase2)), [3, 4]);
  t.deepEqual(toNumberArray(bytify(testCase3)), [1, 2, 3, 4]);
  t.throws(() => bytify(testCase4));
  t.throws(() => bytify([1, 256]));
});
test("should return expected value when calling isObjectLike()", (t) => {
  t.false(isObjectLike(undefined));
  t.true(isObjectLike({}));
});
