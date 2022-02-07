import { Tip } from "@ckb-lumos/base";
import test from "ava";
import { RPC } from "../src";
const indexUri = "http://127.0.0.1:8120";
const rpc = new RPC(indexUri);
test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});
test("get tip", async (t) => {
  const expectTip: Tip = {
    block_hash:
      "0x4d0913d3d9330b1f2acf70d1b38baffa1d0588a92b006be3c5a0ca031e9841c7",
    block_number: "0x63",
  };
  const tip = await rpc.get_tip();
  t.deepEqual(tip, expectTip);
});
