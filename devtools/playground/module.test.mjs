import { createRequire } from "node:module";
import test from "ava";
import { minimatch } from "minimatch";

const MODULES = [
  "@ckb-lumos/bi",
  "@ckb-lumos/codec",
  "@ckb-lumos/codec/bytes",
  "@ckb-lumos/codec/number",
  "@ckb-lumos/toolkit",
  "@ckb-lumos/base",
  "@ckb-lumos/base/blockchain",
  "@ckb-lumos/base/since",
  "@ckb-lumos/base/utils",
];

const require = createRequire(import.meta.url);

MODULES.forEach((module) => {
  test(`Resolve esm&cjs from ${module}`, async (t) => {
    const resolvedEsm = await import.meta.resolve(module);
    const resolvedCjs = require.resolve(module);

    t.true(minimatch(resolvedEsm, `**/lib.esm/**/*.js`));
    t.true(minimatch(resolvedCjs, `**/lib/**/*.js`));

    const esm = await import(module);
    const cjs = require(module);

    const exportedEsm = Object.keys(esm);
    const exportedCjs = Object.keys(cjs);

    t.deepEqual(
      exportedEsm.sort((a, b) => a.localeCompare(b)),
      exportedCjs.sort((a, b) => a.localeCompare(b))
    );

    t.true(exportedEsm.length > 0);
  });
});
