// make sure the `--experimental-import-meta-resolve` flag is enabled when the Node.js is unsupported it
import test from "ava";
import { BI } from "@ckb-lumos/bi";

test("BI works with ESM", async (t) => {
  t.is(typeof BI, "function");

  const exportedPath = await import.meta.resolve("@ckb-lumos/bi");
  t.true(exportedPath.endsWith("lib.esm/index.js"));
});
