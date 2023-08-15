import test from "ava";
import { readFile } from "fs/promises";
import { join } from "path";
import { generateGenesisScriptConfigs, predefined } from "../src";

test("generateFromGenesisBlock", async (t) => {
  const buf = await readFile(join(__dirname, "genesis-mainnet-block.json"));
  const genesisBlock = JSON.parse(buf.toString());

  const config = generateGenesisScriptConfigs(genesisBlock);

  const predefinedConfig = predefined.LINA.SCRIPTS;
  t.deepEqual(config, {
    SECP256K1_BLAKE160: predefinedConfig.SECP256K1_BLAKE160,
    SECP256K1_BLAKE160_MULTISIG: predefinedConfig.SECP256K1_BLAKE160_MULTISIG,
    DAO: predefinedConfig.DAO,
  });
});
