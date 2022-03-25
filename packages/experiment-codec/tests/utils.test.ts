import test from "ava";
import {
  assertHexDecimal,
  assertHexString,
  isObjectLike,
  toArrayBuffer,
} from "../src/utils";

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
test("should toArray buffer return expected", (t) => {
  const testCase0 = new ArrayBuffer(1);
  const testCase1 = new Uint8Array([1, 2]);
  const testCase2 = "0x0304";
  const testCase3 = [1, 2, 3, 4];
  const testCase4 = { length: 8 };

  t.deepEqual(toArrayBuffer(testCase0), testCase0);
  t.deepEqual(toArrayBuffer(testCase1), testCase1.buffer);
  t.deepEqual(toArrayBuffer(testCase2), new Uint8Array([3, 4]).buffer);
  t.deepEqual(toArrayBuffer(testCase3), new Uint8Array([1, 2, 3, 4]).buffer);
  t.throws(() => toArrayBuffer(testCase4));
});
test("should isObjectLike return false", (t) => {
  t.false(isObjectLike(undefined));
  t.true(isObjectLike({}));
});
