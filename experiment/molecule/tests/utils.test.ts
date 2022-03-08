import test from "ava";
import { assertHexString } from "../src/utils";

test("should assertHexString fail", (t) => {
  t.throws(() => assertHexString("00"));
});
