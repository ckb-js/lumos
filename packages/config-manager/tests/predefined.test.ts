import test from "ava";
import { createConfig } from "../src";

test("createConfig should be frozen", (t) => {
  const config = createConfig({ PREFIX: "ckt", SCRIPTS: {} });
  t.true(Object.isFrozen(config));
});
