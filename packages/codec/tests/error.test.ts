import test, { ExecutionContext } from "ava";
import escapeStringRegexp from "escape-string-regexp";
import { trackCodecErrorPath } from "../src/base";
import { array, struct, table } from "../src/molecule";
import { dynvec, fixvec, option } from "../src/molecule/layout";
import { Uint16, Uint32, Uint8 } from "../src/number";

const expectThrowCodecError = (
  t: ExecutionContext<any>,
  fn: () => any,
  message: string
) => {
  t.throws(fn, {
    instanceOf: Error,
    message: new RegExp(`${escapeStringRegexp(message)}.*`, "m"),
  });
};

test("test simple array codec error", (t) => {
  const codec = trackCodecErrorPath(array(Uint8, 3));
  expectThrowCodecError(
    t,
    () => codec.pack([0x1, 0xfff, 0x3]),
    `Expect type Uint8 in input[1] but got error: Value must be between 0 and 255, but got`
  );
});

test("test simple struct error", (t) => {
  const codec = trackCodecErrorPath(
    struct({ f1: Uint8, f2: Uint16, f3: Uint32 }, ["f1", "f2", "f3"])
  );
  expectThrowCodecError(
    t,
    () => codec.pack({ f1: 0x114514, f2: 0x0, f3: 0x0 }),
    `Expect type Uint8 in input.f1 but got error: Value must be between 0 and 255, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ f1: 0x0, f2: 0x114514, f3: 0x0 }),
    `Expect type Uint16LE in input.f2 but got error: Value must be between 0 and 65535, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ f1: 0x0, f2: 0x0, f3: 0x1145141919810 }),
    `Expect type Uint32LE in input.f3 but got error: Value must be between 0 and 4294967295, but got`
  );
});

test("simple table", (t) => {
  const codec = trackCodecErrorPath(
    table({ f1: Uint8, f2: Uint8, f3: Uint8 }, ["f1", "f2", "f3"])
  );
  expectThrowCodecError(
    t,
    () => codec.pack({ f1: 0x1, f2: 0xffff, f3: 0x1 }),
    `Expect type Uint8 in input.f2 but got error: Value must be between 0 and 255, but got`
  );
  expectThrowCodecError(
    t,
    () => codec.pack({ f1: 0x1, f2: 0x2, f3: 0x2333 }),
    `Expect type Uint8 in input.f3 but got error: Value must be between 0 and 255, but got`
  );
});

test("nested type", (t) => {
  const codec = trackCodecErrorPath(
    table(
      {
        byteField: Uint8,
        arrayField: array(Uint8, 3),
        structField: struct({ f1: Uint8, f2: Uint8 }, ["f1", "f2"]),
        fixedVec: fixvec(Uint8),
        dynVec: dynvec(dynvec(Uint8)),
        option: option(Uint8),
      },
      ["byteField", "arrayField", "structField", "fixedVec", "dynVec", "option"]
    )
  );

  const validInput: Parameters<typeof codec["pack"]>[0] = {
    byteField: 0x1,
    arrayField: [0x2, 0x3, 0x4],
    structField: { f1: 0x5, f2: 0x6 },
    fixedVec: [0x7, 0x8, 0x9],
    dynVec: [
      [0xa, 0xb, 0xc],
      [0xd, 0xe, 0xf],
    ],
    option: 0x10,
  };

  expectThrowCodecError(
    t,
    () => codec.pack({ ...validInput, byteField: 0x2333 }),
    `Expect type Uint8 in input.byteField but got error: Value must be between 0 and 255, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ ...validInput, arrayField: [0x1, 0x2, 0x2333] }),
    `Expect type Uint8 in input.arrayField[2] but got error: Value must be between 0 and 255, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ ...validInput, structField: { f1: 0x1, f2: 0x2333 } }),
    `Expect type Uint8 in input.structField.f2 but got error: Value must be between 0 and 255, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ ...validInput, fixedVec: [0x1, 0x2, 0x2333] }),
    `Expect type Uint8 in input.fixedVec[2] but got error: Value must be between 0 and 255, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ ...validInput, dynVec: [[0x1, 0x2, 0x2333]] }),
    `Expect type Uint8 in input.dynVec[0][2] but got error: Value must be between 0 and 255, but got`
  );

  expectThrowCodecError(
    t,
    () => codec.pack({ ...validInput, option: 0x2333 }),
    `Expect type Uint8 in input.option but got error: Value must be between 0 and 255, but got`
  );
});
