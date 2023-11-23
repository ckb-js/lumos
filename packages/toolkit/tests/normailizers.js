const test = require("ava");
const { normalizers } = require("../lib");

test("correct outPoint should pass validation", (t) => {
  const normalizedOutpoint = normalizers.NormalizeOutPoint({
    txHash: `0x${"00".repeat(32)}`,
    index: "0x1",
  });
  const expectedNormalizedIndex = new ArrayBuffer(4);
  const view = new Int32Array(expectedNormalizedIndex);
  view[0] = 1;

  t.deepEqual(normalizedOutpoint, {
    index: expectedNormalizedIndex,
    txHash: new ArrayBuffer(32),
  });
});

test("error outPoint should not pass validation", (t) => {
  t.throws(() => {
    normalizers.NormalizeOutPoint({
      txHash: `0x${"00".repeat(32)}`,
      index: "0x",
    });
  });
  t.throws(() => {
    normalizers.NormalizeOutPoint({
      txHash: `0x${"00".repeat(32)}`,
      index: "not a number",
    });
  });
});

test("normalizeScript should work", (t) => {
  ["type", "data", "data1", "data2", 0, 1, 2, 4].forEach((hashType) => {
    normalizers.NormalizeScript({
      codeHash: `0x${"00".repeat(32)}`,
      args: "0x",
      hashType,
    });
  });

  t.pass();

  t.throws(() => {
    normalizers.NormalizeScript({
      codeHash: `0x${"00".repeat(32)}`,
      args: "0x",
      hashType: "unknown",
    });
  });
});
