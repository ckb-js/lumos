import { HashType } from "@ckb-lumos/base";
import test from "ava";
import { Indexer, TransactionCollector } from "../src";

const nodeUri = "https://testnet.ckb.dev/rpc";
const indexUri = "https://testnet.ckb.dev/indexer";
const indexer = new Indexer(indexUri, nodeUri);
const queryOption = {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as HashType,
    args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
  },
};
test("input cell can be found transaction detail", async (t) => {
  const cellCollector = new TransactionCollector(indexer, queryOption, nodeUri);
  const count = await cellCollector.count();
  t.is(count, 2);
});
