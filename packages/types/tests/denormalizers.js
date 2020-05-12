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
