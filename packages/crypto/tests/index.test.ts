import test from "ava";
import { randomBytes } from "../src";

test("randomBytes", (t) => {
  const size = 32;
  const bytes = randomBytes(size);
  t.is(bytes.length, size);
  t.is(bytes.byteLength, size);
  t.is(bytes.constructor, Uint8Array);

  const TOO_MANY_BYTES = 65538;
  t.throws(() => randomBytes(TOO_MANY_BYTES), {
    instanceOf: RangeError,
    message: `size must be less than or equal to 65536`,
  });
});
