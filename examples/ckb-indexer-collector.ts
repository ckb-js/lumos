// This example shows how to use the CkbIndexer to collect cells

import { Script, Indexer, helpers, config, BI } from "@ckb-lumos/lumos";

config.initializeConfig(config.predefined.LINA);

const nodeUri = "https://testnet.ckb.dev/rpc";
const indexUri = "https://testnet.ckb.dev/indexer";
const indexer = new Indexer(indexUri, nodeUri);

async function capacityOf(lock: Script): Promise<BI> {
  const collector = indexer.collector({ lock });

  let balance: BI = BI.from(0);
  
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}

async function exact_cell_collector() {
  const address = "ckt1qyq97krr9gfrulnnrkctt889plsk27w8m9qsetfrg0";
  const lock:Script = {
            codeHash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hashType: "type",
            args: "0x5f58632a123e7e731db0b59ce50fe16579c7d941",
        }

  const balance = await capacityOf(lock);

  const integer = balance.div(BI.from(10).pow(8));
  const fraction = balance.mod(BI.from(10).pow(8));

  console.log(`lock of ${address} is`, lock, "\n");
  console.log(`total CKB of ${address} is ${integer + "." + fraction}`);
}

async function main() {
  const address = "ckt1qyqxgftlqzmtv05cwcyl4xlz6ryx6dgsyrasjrp27t";
  const lock: Script = helpers.parseAddress(address);

  const balance = await capacityOf(lock);

  const integer = balance.div(BI.from(10).pow(8));
  const fraction = balance.mod(BI.from(10).pow(8));

  console.log(`lock of ${address} is`, lock, "\n");
  console.log(`total CKB of ${address} is ${integer + "." + fraction}`);
}

main();
exact_cell_collector();