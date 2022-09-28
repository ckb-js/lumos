import test from "ava";
import { Indexer, RPC } from "@ckb-lumos/ckb-indexer";
import { CKB_RPC_URI, INDEXER_RPC_URI } from "../src/constants";

const ckbIndexer = new Indexer(INDEXER_RPC_URI, CKB_RPC_URI);
const indexerRpc = new RPC(INDEXER_RPC_URI);

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("get tip", async (t) => {
  const tip = await ckbIndexer.tip();
  t.true(typeof tip.blockHash === "string");
  t.true(typeof tip.blockNumber == "string");
});

test("indexer rpc get tips", async (t) => {
  const [indexerTip, rpcTip] = await Promise.all([
    ckbIndexer.tip(),
    indexerRpc.getTip(),
  ]);

  t.deepEqual(indexerTip, rpcTip);
});
