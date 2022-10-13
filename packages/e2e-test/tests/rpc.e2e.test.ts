import anyTest, { TestInterface } from "ava";
import { generateHDAccount, HDAccount } from "../src/utils";
import { CKB_RPC_URL, INDEXER_RPC_URL } from "../src/constants";
import { E2EProvider } from "../src/e2eProvider";
import { join } from "path";
import { FileFaucetQueue } from "../src/faucetQueue";
import { Cell } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import { Indexer } from "@ckb-lumos/ckb-indexer";

interface TestContext {
  accounts: Record<
    string,
    HDAccount & {
      cells: Cell[];
    }
  >;
  config: Config;
}

const test = anyTest as TestInterface<TestContext>;

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(INDEXER_RPC_URL, CKB_RPC_URL);

const faucetQueue = new FileFaucetQueue(join(__dirname, "../tmp/"));
const e2eProvider = new E2EProvider({ indexer, rpc, faucetQueue: faucetQueue });

test.before(async (t) => {
  const config = await e2eProvider.loadLocalConfig();
  const alice = generateHDAccount();

  await e2eProvider.claimCKB({ claimer: alice.address });
  await e2eProvider.claimCKB({ claimer: alice.address });
  await e2eProvider.claimCKB({ claimer: alice.address });

  const aliceCells = await e2eProvider.findCells({
    lock: alice.lockScript,
    order: "asc",
  });

  t.context = {
    accounts: {
      alice: {
        ...alice,
        cells: aliceCells,
      },
    },
    config,
  };
});

test("get indexer tip", async (t) => {
  const tip = await rpc.getIndexerTip();
  t.true(typeof tip.blockHash === "string");
  t.true(typeof tip.blockNumber == "string");
});

test("get cells rpc", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await rpc.getCells(
    {
      script: alice.lockScript,
      scriptType: "lock",
    },
    "asc",
    "0x64"
  );

  t.deepEqual(cells.objects.length, alice.cells.length);
  t.deepEqual(
    cells.objects.map((obj) => obj.output),
    alice.cells.map((cell) => cell.cellOutput)
  );
});

test("get transactions rpc", async (t) => {
  const alice = t.context.accounts["alice"];

  const result = await rpc.getTransactions(
    {
      script: alice.lockScript,
      scriptType: "lock",
      groupByTransaction: true,
    },
    "asc",
    "0x64"
  );

  t.deepEqual(result.objects.length, alice.cells.length);
  t.deepEqual(
    result.objects.map((obj) => obj.blockNumber),
    alice.cells.map((cell) => cell.blockNumber)
  );

  const unGrouped = await rpc.getTransactions(
    {
      script: alice.lockScript,
      scriptType: "lock",
    },
    "asc",
    "0x64"
  );

  t.deepEqual(unGrouped.objects.length, alice.cells.length);
  result.objects.map((obj) =>
    obj.cells.map(([ioType]) => {
      t.deepEqual(ioType, "output");
    })
  );
});

test("get cells capacity rpc", async (t) => {
  const alice = t.context.accounts["alice"];
  const capacity = await e2eProvider.getCapacities(alice.address);

  const result = await rpc.getCellsCapacity({
    script: alice.lockScript,
    scriptType: "lock",
  });

  t.deepEqual(result.capacity, capacity.toHexString());
});
