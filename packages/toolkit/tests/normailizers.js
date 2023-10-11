const test = require("ava");
const { normalizers } = require("../lib");

test("correct outPoint should pass validation", (t) => {
  normalizers.NormalizeOutPoint({
    txHash: `0x${"00".repeat(32)}`,
    index: "0x1",
  });
  t.pass();
});
