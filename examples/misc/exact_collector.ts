import { Indexer } from "@ckb-lumos/lumos";
const nodeUri = "https://testnet.ckb.dev/rpc";

const indexer = new Indexer(nodeUri);

const exact_cell_collector = async () => {
  const cellCollector = indexer.collector({
    lock: {
      codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x5f58632a123e7e731db0b59ce50fe16579c7d941",
    },
    scriptSearchMode: "exact",
  });

  let exact_flag: boolean = true;

  for await (const cell of cellCollector.collect()) {
    console.log(cell);
    if (cell.cellOutput.lock.args.endsWith("01")) {
      exact_flag = false;
      console.log("[-] Error. Still Prefix Search which could be DoS.");
    }
  }

  if (exact_flag) {
    console.log("[+] Yeah. Exact Search Support to Collector");
  }
};

exact_cell_collector();
