import { initializeConfig, predefined } from "../src";
import test from "ava";
import fs from "fs";
import path from "path";

test("[deprecated] initialize config by file", (t) => {
  t.throws(() => initializeConfig());

  const configPath = path.join(__dirname, "config.json");
  process.env.LUMOS_CONFIG_FILE = configPath;
  fs.writeFileSync(configPath, Buffer.from(JSON.stringify(predefined.LINA), "utf8"));
  initializeConfig();
  fs.unlinkSync(configPath);
  t.pass();
});
