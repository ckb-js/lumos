import test from "ava";
import { readFile } from "fs/promises";
import { join } from "path";
import { generateGenesisScriptConfigs, predefined } from "../src";
import { Block } from "@ckb-lumos/base";

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

test("generateFromGenesisBlock with wrong block", async (t) => {
  const buf = await readFile(join(__dirname, "genesis-mainnet-block.json"));
  const genesisBlock: Block = JSON.parse(buf.toString());

  t.throws(() => {
    const wrongBlock = clone(genesisBlock);
    wrongBlock.header.number = "0x111";
    generateGenesisScriptConfigs(wrongBlock);
  });

  t.throws(() => {
    const wrongBlock = clone(genesisBlock);
    wrongBlock.transactions[0].outputs[1].type = undefined;
    generateGenesisScriptConfigs(wrongBlock);
  });
});

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
