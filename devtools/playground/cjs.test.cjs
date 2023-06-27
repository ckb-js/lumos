const test = require("ava");

test("BI works with CJS", async (t) => {
  const { BI } = require("@ckb-lumos/bi");
  t.is(typeof BI, "function");
  t.true(require.resolve("@ckb-lumos/bi").endsWith("lib/index.js"));
});
