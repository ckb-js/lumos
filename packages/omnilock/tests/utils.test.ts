import test from "ava";
import { isKeyOf, invertKV } from "../src/utils";

test("utils#isKeyOf", (t) => {
  t.true(isKeyOf({ a: 1, b: 2 }, "a"));
  t.false(isKeyOf({ a: 1, b: 2 }, "unknown"));
});

test("utils#invertKV", (t) => {
  const inverted = invertKV({ a: 1, b: 2 } as const);

  t.true(isKeyOf(inverted, 1));
  t.deepEqual(inverted, { 1: "a", 2: "b" });
});
