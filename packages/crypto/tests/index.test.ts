import test from "ava";
import { randomBytes } from "../src";
import { hexify } from "../../codec/lib/bytes";

test("randomBytes", (t) => {
  const size = 32;
  const bytes = randomBytes(size);
  t.is(bytes.length, size);
  t.is(bytes.toString("hex"), hexify(bytes).slice(2));

  const TOO_MANY_BYTES = 65538;
  t.throws(() => randomBytes(TOO_MANY_BYTES), {
    instanceOf: RangeError,
    message: `size must be less than or equal to 65536`,
  });
});
