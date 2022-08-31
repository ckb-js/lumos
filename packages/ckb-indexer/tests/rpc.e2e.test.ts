import { Tip, Script } from "@ckb-lumos/base";
import test from "ava";
import { Indexer, RPC } from "../src";

const indexerRpcUri = "http://127.0.0.1:8120";
const ckbRpcUri = "http://127.0.0.1:8118";
const ckbIndexer = new Indexer(indexerRpcUri, ckbRpcUri);
const indexerRpc = new RPC(indexerRpcUri);

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});
test("get tip", async (t) => {
  const expectTip: Tip = {
    blockHash:
      "0x4d0913d3d9330b1f2acf70d1b38baffa1d0588a92b006be3c5a0ca031e9841c7",
    blockNumber: "0x63",
  };

  const tip = await ckbIndexer.tip();
  t.deepEqual(tip, expectTip);
});

test("indexer rpc get tips", async (t) => {
  const expectTip: Tip = {
    blockHash:
      "0x4d0913d3d9330b1f2acf70d1b38baffa1d0588a92b006be3c5a0ca031e9841c7",
    blockNumber: "0x63",
  };
  const tip = await indexerRpc.getTip();
  t.deepEqual(tip, expectTip);
});

test("indexer rpc get cells without data", async (t) => {
  const lock: Script = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
    args: "0x19c5d58c535273452ac60f9d37831601adcf12b8",
  };

  const notsetWithDataCells = await indexerRpc.getCells(
    {
      script: lock,
      scriptType: "lock",
    },
    "asc",
    "0x64"
  );
  t.deepEqual(
    notsetWithDataCells.objects[0].outputData,
    "0x5468616e6b20796f75205361746f7368692e"
  );

  const withDataCells = await indexerRpc.getCells(
    {
      script: lock,
      scriptType: "lock",
      withData: true,
    },
    "asc",
    "0x64"
  );
  t.deepEqual(
    withDataCells.objects[0].outputData,
    "0x5468616e6b20796f75205361746f7368692e"
  );

  const withoutDataCells = await indexerRpc.getCells(
    {
      script: lock,
      scriptType: "lock",
      withData: false,
    },
    "asc",
    "0x64"
  );
  t.deepEqual(withoutDataCells.objects[0].outputData, null);
});

test("indexer rpc get group by hash transactions", async (t) => {
  const lock: Script = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
    args: "0x19c5d58c535273452ac60f9d37831601adcf12b8",
  };

  const ungroupedTransactions = await indexerRpc.getTransactions(
    {
      script: lock,
      scriptType: "lock",
    },
    "asc",
    "0x64"
  );
  t.deepEqual(ungroupedTransactions.objects[0].ioIndex, "0x0");
  t.deepEqual(ungroupedTransactions.objects[0].ioType, "output");

  const groupedTransactions = await indexerRpc.getTransactions(
    {
      script: lock,
      scriptType: "lock",
      groupByTransaction: true,
    },
    "asc",
    "0x64"
  );
  t.deepEqual(groupedTransactions.objects[0].cells.length, 1);
  t.deepEqual(groupedTransactions.objects[0].cells[0][0], "output");
  t.deepEqual(groupedTransactions.objects[0].cells[0][1], "0x0");
});
