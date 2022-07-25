const test = require("ava");

const { validateConfig, predefined } = require("../lib/index");

test.before(() => {
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("validate all predefined config", (t) => {
  for (const name of Object.keys(predefined)) {
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
        ABC: {},
      },
    });
  });

  t.throws(() => {
    validateConfig(null);
  });
});
