import test from "ava";
import { assertHexDecimal, assertHexString } from "../src/utils";

test("should assertHexString fail", (t) => {
  t.throws(() => assertHexString("00"));
});
test("should assertHexDecimal fail", (t) => {
  t.throws(() => assertHexDecimal("0x"));
  t.throws(() => assertHexDecimal("0x123", 1));
  t.truthy(assertHexDecimal("0x0") === undefined);
  t.truthy(assertHexDecimal("0x12", 1) === undefined);
});
