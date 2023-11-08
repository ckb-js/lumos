import test from "ava";
import { validateConfig, predefined } from "../src";
import { assertHashType } from "../src/manager";

test.before(() => {
  BigInt = (() => {
    throw new Error("can not find bigint");
  }) as unknown as BigIntConstructor;
});

test("validate all predefined config", (t) => {
  const keys = Object.keys(predefined) as [keyof typeof predefined];
  for (const name of keys) {
    t.notThrows(() => {
      validateConfig(predefined[name]);
    }, `Predefined config ${name} fails verification!`);
  }
});

test("validate minimal config", (t) => {
  t.notThrows(() => {
    validateConfig({
      PREFIX: "ckb",
      SCRIPTS: {},
    });
  });
});

test("invalidate config", (t) => {
  t.throws(() => {
    validateConfig({
      PREFIX: "ckb",
      SCRIPTS: {
        //@ts-expect-error
        ABC: {},
      },
    });
  });

  t.throws(() => {
    //@ts-expect-error
    validateConfig(null);
  });
});

test("data2 works with ScriptConfig", (t) => {
  t.notThrows(() => {
    assertHashType("debugPath", "type");
    assertHashType("debugPath", "data");
    assertHashType("debugPath", "data1");
    assertHashType("debugPath", "data2");
  });
});
