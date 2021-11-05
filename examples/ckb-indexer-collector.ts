// This example shows how to use the CkbIndexer to collect cells

import { Script } from "@ckb-lumos/base";
import { CkbIndexer } from "@ckb-lumos/ckb-indexer";
import { parseAddress } from "@ckb-lumos/helpers";
import { initializeConfig, predefined } from "@ckb-lumos/config-manager";

initializeConfig(predefined.AGGRON4);

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const indexer = new CkbIndexer(CKB_INDEXER_URL, CKB_RPC_URL);

async function capacityOf(lock: Script): Promise<bigint> {
  const collector = indexer.collector({ lock });

  let balance = 0n;
  for await (const cell of collector.collect()) {
    balance += BigInt(cell.cell_output.capacity);
  }

  return balance;
}

async function main() {
  const address = "ckt1qyqxgftlqzmtv05cwcyl4xlz6ryx6dgsyrasjrp27t";
  const lock: Script = parseAddress(address);

  const balance = await capacityOf(lock);

  const integer = balance / 10n ** 8n;
  const fraction = balance % 10n ** 8n;

  console.log(`lock of ${address} is`, lock, "\n");
  console.log(`total CKB of ${address} is ${integer + "." + fraction}`);
}

main();
