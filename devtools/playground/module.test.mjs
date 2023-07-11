import { createRequire } from "node:module";
import test from "ava";
import { minimatch } from "minimatch";

const MODULES = [
  "@ckb-lumos/bi",
  "@ckb-lumos/codec",
  "@ckb-lumos/codec/bytes",
  "@ckb-lumos/codec/number",
];

const require = createRequire(import.meta.url);

MODULES.forEach((module) => {
  test(`Resolve esm&cjs from ${module}`, async (t) => {
    const resolvedEsm = await import.meta.resolve(module);
    const resolvedCjs = require.resolve(module);

    t.true(minimatch(resolvedEsm, `**/lib.esm/**/*.js`));
    t.true(minimatch(resolvedCjs, `**/lib/**/*.js`));
  });
});
