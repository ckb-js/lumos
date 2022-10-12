import test from "ava";
import { isBIish, BI, toJSBI, parseUnit, formatUnit, Unit } from "../src/index";
import JSBI from "jsbi";

test("validate if a value is BIish", (t) => {
  t.is(isBIish(1), true);
  t.is(isBIish(-1), true);
  t.is(isBIish("1"), true);
  t.is(isBIish("-1"), true);
  t.is(isBIish("0xf"), true);
  t.is(isBIish("0xF"), true);
  t.is(isBIish(BigInt(1)), true);
  t.is(isBIish(BI.from(1)), true);
  t.is(isBIish("f"), false);
  t.is(isBIish("0x"), false);
});

test("addition", (t) => {
  const bi = BI.from(1);
  t.is(bi.add(2).toNumber(), 3);
  t.is(bi.add("2").toNumber(), 3);
  t.is(bi.add("0x2").toNumber(), 3);
});

test("subtraction", (t) => {
  const bi = BI.from("3");
  t.is(bi.sub(1).toNumber(), 2);
  t.is(bi.sub("-1").toNumber(), 4);
  t.is(bi.sub("0x4").toNumber(), -1);
});

test("division", (t) => {
  const bi = BI.from("0x10");
  t.is(bi.div("0x4").toNumber(), 4);
  t.is(bi.div(-2).toNumber(), -8);
  t.throws(() => {
    bi.div("0");
  });
});

test("multiplication", (t) => {
  const bi = BI.from(BigInt(2));
  t.is(bi.mul(3).toNumber(), 6);
  t.is(bi.mul(BI.from(2)).toNumber(), 4);
});

test("remainder", (t) => {
  const bi = BI.from(7);
  t.is(bi.mod(3).toNumber(), 1);
  t.throws(() => {
    bi.mod(0);
  });
  t.is(BI.from(-7).mod(4).toNumber(), -3);
});

test("absolute value", (t) => {
  t.is(BI.from(2).abs().toNumber(), 2);
  t.is(BI.from(-2).abs().toNumber(), 2);
});

test("exponentiation", (t) => {
  const bi = BI.from(2);
  t.is(bi.pow(3).toNumber(), 8);
  t.is(bi.pow(0).toNumber(), 1);
});

test("bitwise and", (t) => {
  t.is(BI.from("0x1234").and("0xff").toHexString(), "0x34");
});

test("bitwise or", (t) => {
  t.is(BI.from("0xf0").or("0xf").toHexString(), "0xff");
});

test("bitwise xor", (t) => {
  t.is(BI.from("0xf0f0f0f0").xor("0xf0ff0f0").toHexString(), "0xffff0000");
});

test("bitwise not", (t) => {
  t.is(BI.from("5").not().toNumber(), -6);
});

test("mask", (t) => {
  t.is(BI.from(3).mask(1).toNumber(), 1);
  t.is(BI.from("0x1234567").mask(8).toHexString(), "0x67");
  t.is(BI.from("0x12345").mask(30).toHexString(), "0x12345");
  t.throws(() => {
    BI.from(-1).mask(3);
  });
  t.throws(() => {
    BI.from(1).mask(-3);
  });
});

test("left shifting", (t) => {
  t.is(BI.from(3).shl(2).toNumber(), 12);
});

test("right shifting", (t) => {
  t.is(BI.from("0xff").shr(4).toHexString(), "0xf");
});

test("equal", (t) => {
  t.is(BI.from(3).eq("3"), true);
  t.is(BI.from(3).eq(3), true);
  t.is(BI.from(3).eq("0x3"), true);
  t.is(BI.from(3).eq(BigInt(3)), true);
  t.is(BI.from(3).eq(BI.from(3)), true);
  t.is(BI.from(3).eq(2), false);
});

test("less than", (t) => {
  t.is(BI.from(3).lt(5), true);
  t.is(BI.from(-3).lt("5"), true);
  t.is(BI.from("-3").lt(-2), true);
  t.is(BI.from(5).lt(3), false);
  t.is(BI.from(-3).lt(-5), false);
  t.is(BI.from(3).lt(3), false);
});

test("less than and equal", (t) => {
  t.is(BI.from(3).lte(5), true);
  t.is(BI.from(-3).lte("5"), true);
  t.is(BI.from("-3").lte(-2), true);
  t.is(BI.from(5).lte(3), false);
  t.is(BI.from(-3).lte(-5), false);
  t.is(BI.from(3).lte(3), true);
});

test("greater than", (t) => {
  t.is(BI.from(3).gt(5), false);
  t.is(BI.from(-3).gt("5"), false);
  t.is(BI.from("-3").gt(-2), false);
  t.is(BI.from(5).gt(3), true);
  t.is(BI.from(-3).gt(-5), true);
  t.is(BI.from(3).gt(3), false);
});

test("greater than and equal", (t) => {
  t.is(BI.from(3).gte(5), false);
  t.is(BI.from(-3).gte("5"), false);
  t.is(BI.from("-3").gte(-2), false);
  t.is(BI.from(5).gte(3), true);
  t.is(BI.from(-3).gte(-5), true);
  t.is(BI.from(3).gte(3), true);
});

test("is negative", (t) => {
  t.is(BI.from(3).isNegative(), false);
  t.is(BI.from(-3).isNegative(), true);
  t.is(BI.from(0).isNegative(), false);
});

test("is zero", (t) => {
  t.is(BI.from(3).isZero(), false);
  t.is(BI.from(-3).isZero(), false);
  t.is(BI.from(0).isZero(), true);
});

test("to number", (t) => {
  t.is(BI.from(3).toNumber(), 3);
  t.is(BI.from("-3").toNumber(), -3);
  t.is(BI.from("0x3").toNumber(), 3);
  t.is(BI.from(BigInt(3)).toNumber(), 3);
});

test("to bigint", (t) => {
  t.is(BI.from(3).toBigInt(), BigInt(3));
});

test("to string", (t) => {
  const bi = BI.from(1234);
  t.is(bi.toString(), "1234");
  t.is(bi.toString(10), "1234");
  t.is(bi.toString(16), "4d2");
  t.is(bi.toString(2), "10011010010");
});

test("to hex string", (t) => {
  t.is(BI.from(15).toHexString(), "0xf");
  t.is(BI.from(-15).toHexString(), "-0xf");
});

test("from", (t) => {
  t.throws(() => {
    BI.from("0x");
  });
  t.throws(() => {
    BI.from("ss");
  });
});

test("is BI", (t) => {
  t.is(BI.isBI(BI.from(0)), true);
  t.is(BI.isBI(0), false);
  t.is(BI.isBI("0"), false);
  t.is(BI.isBI("0x0"), false);
  t.is(BI.isBI(BI.from(BI.from(0))), true);
});

test("to jsbi", (t) => {
  const bi = BI.from(2);
  const jsbi = JSBI.BigInt(2);
  t.is(toJSBI(bi) instanceof JSBI, true);
  t.is(JSBI.equal(toJSBI(bi), jsbi), true);
});

test("from JSBI", (t) => {
  const bi = BI.from(JSBI.BigInt(2));
  const jsbi = JSBI.BigInt(2);
  t.is(toJSBI(bi) instanceof JSBI, true);
  t.is(JSBI.equal(toJSBI(bi), jsbi), true);
});

const invalidUnits = ["whatever", -1, 0.1];

test("formatUnit", (t) => {
  const invalidValues = ["100.01", "1.0.1", "-.4", "100.0"];
  for (const invalidValue of invalidValues) {
    t.throws(
      () => {
        formatUnit(invalidValue, "ckb");
      },
      { instanceOf: Error }
    );
  }

  for (const invalidUint of invalidUnits) {
    t.throws(
      () => {
        formatUnit("1", <Unit>invalidUint);
      },
      { instanceOf: Error }
    );
  }

  const testCases = [
    { value: 123000000, unit: "shannon", result: "123000000" },
    { value: "0x40", unit: "shannon", result: "64" },
    { value: 123000000, unit: 0, result: "123000000" },
    { value: 123000000, unit: 2, result: "1230000.0" },
    { value: 123000000, unit: "ckb", result: "1.23" },
    { value: BI.from(2), unit: "ckb", result: "0.00000002" },
    { value: -123404320, unit: 7, result: "-12.340432" },
  ];
  for (const { value, unit, result } of testCases) {
    t.is(formatUnit(value, <Unit>unit), result);
  }
});

test("parseUnit", (t) => {
  const invalidValues = [".", "-", "-.4", "1.0.", "", " "];
  for (const invalidValue of invalidValues) {
    t.throws(
      () => {
        parseUnit(invalidValue, "ckb");
      },
      { instanceOf: Error }
    );
  }

  for (const invalidUint of invalidUnits) {
    t.throws(
      () => {
        parseUnit("1", <Unit>invalidUint);
      },
      { instanceOf: Error }
    );
  }

  const decimalExceeds = [
    { value: "1.01", unit: "shannon" },
    { value: "-0.1", unit: "shannon" },
    { value: "0.000000001", unit: "ckb" },
  ];
  for (const { value, unit } of decimalExceeds) {
    t.throws(
      () => {
        parseUnit(value, <Unit>unit);
      },
      { instanceOf: Error }
    );
  }

  const testCases = [
    { value: "1", unit: "ckb", result: BI.from(1e8) },
    { value: "-01.00", unit: "ckb", result: BI.from(-1e8) },
    { value: "-0.04", unit: "ckb", result: BI.from(-4e6) },
    { value: "123.321", unit: "ckb", result: BI.from(123321e5) },
    { value: "0.00000001", unit: "ckb", result: BI.from(1) },
    { value: "100000000", unit: "shannon", result: BI.from(1e8) },
    { value: "0.00000001", unit: 8, result: BI.from(1) },
    { value: "-0.0000001", unit: 8, result: BI.from(-10) },
    { value: "0.0000001", unit: 7, result: BI.from(1) },
    { value: "1.1", unit: 18, result: BI.from(10).pow(17).mul(11) },
  ];
  for (const { value, unit, result } of testCases) {
    t.is(parseUnit(value, <Unit>unit).eq(result), true);
  }
});
