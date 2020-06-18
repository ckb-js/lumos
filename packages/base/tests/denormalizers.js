const test = require("ava");
const { normalizers } = require("ckb-js-toolkit");

const core = require("../lib/core");
const denormalizers = require("../lib/denormalizers");

test("denormalize script", t => {
  const script = {
    code_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    args: "0x1234",
    hash_type: "data"
  };
  const data = core.SerializeScript(normalizers.NormalizeScript(script));
  const script2 = denormalizers.DenormalizeScript(new core.Script(data));
  t.deepEqual(script, script2);
});

test("denormalize out_point", t => {
  const outPoint = {
    tx_hash:
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
    index: "0x3"
  };
  const data = core.SerializeOutPoint(normalizers.NormalizeOutPoint(outPoint));
  const outPoint2 = denormalizers.DenormalizeOutPoint(new core.OutPoint(data));
  t.deepEqual(outPoint, outPoint2);
});
