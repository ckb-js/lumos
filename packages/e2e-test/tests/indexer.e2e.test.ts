import anyTest, { TestInterface } from "ava";
import { randomSecp256k1Account, Account } from "../src/utils";
import { CKB_RPC_URL } from "../src/constants";
import { E2EProvider } from "../src/e2eProvider";
import { join } from "path";
import { FileFaucetQueue } from "../src/faucetQueue";
import { Cell, Script } from "@ckb-lumos/base";
import { encodeToAddress } from "@ckb-lumos/helpers";
import { Config } from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import { Indexer } from "@ckb-lumos/ckb-indexer";

interface TestContext {
  accounts: Record<
    string,
    Account & {
      cells: Cell[];
    }
  >;
  config: Config;
}
const test = anyTest as TestInterface<TestContext>;

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_RPC_URL);

const faucetQueue = new FileFaucetQueue(join(__dirname, "../tmp/"));
const e2eProvider = new E2EProvider({ indexer, rpc, faucetQueue: faucetQueue });

test.before(async (t) => {
  const config = await e2eProvider.loadLocalConfig();
  const alice = randomSecp256k1Account();

  await Promise.all([
    e2eProvider.claimCKB({ claimer: alice.address }),
    e2eProvider.claimCKB({ claimer: alice.address }),
  ]);

  await e2eProvider.waitForBlock({
    relative: true,
    value: 1,
  });

  await Promise.all([
    e2eProvider.claimCKB({ claimer: alice.address }),
    e2eProvider.claimCKB({ claimer: alice.address }),
    e2eProvider.claimCKB({ claimer: alice.address }),
  ]);

  await e2eProvider.waitTransactionCommitted(
    await e2eProvider.daoDeposit({ fromPk: alice.privKey })
  );

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

test("Test query cells by lock script", async (t) => {
  const alice = t.context.accounts["alice"];
  const cells = await e2eProvider.findCells({ lock: alice.lockScript });

  t.deepEqual(cells.length, alice.cells.length);
  t.deepEqual(cells, alice.cells);
});

test("Test query cells by lock script script and between block range", async (t) => {
  const alice = t.context.accounts["alice"];

  const fromBlock = alice.cells[2].blockNumber!;
  const toBlock = alice.cells[4].blockNumber!;

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    fromBlock,
    toBlock,
  });

  cells.map((cell) =>
    t.true(parseInt(fromBlock) <= parseInt(cell.blockNumber!))
  );
  cells.map((cell) => t.true(parseInt(toBlock) >= parseInt(cell.blockNumber!)));
});

test("Test query cells by lock script and skip the first 2 cells", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    skip: 2,
  });

  t.deepEqual(cells.length, alice.cells.length - 2);
  t.deepEqual(cells, alice.cells.slice(2));
});

test("Test query cells by lock script and return the cells in desc order", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    order: "desc",
  });

  t.deepEqual(cells.length, alice.cells.length);
  t.deepEqual(cells, [...alice.cells].reverse());
});

test("Test query cells by lock script, return the cells in desc order then skip the first 2 cells", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    skip: 2,
    order: "desc",
  });

  t.deepEqual(cells.length, alice.cells.length - 2);
  t.deepEqual(cells, [...alice.cells].reverse().slice(2));
});

test("Test query cells by lock script with argsLen as number", async (t) => {
  const alice = t.context.accounts["alice"];

  const alicePrefixLock: Script = {
    ...alice.lockScript,
    args: alice.lockScript.args.slice(0, 20), // length: 9
  };

  const alicePrefixAccount = encodeToAddress(alicePrefixLock);
  await e2eProvider.claimCKB({ claimer: alicePrefixAccount });

  const cells = await e2eProvider.findCells({
    lock: alicePrefixLock,
    argsLen: 20,
  });

  t.deepEqual(cells.length, alice.cells.length);
  t.deepEqual(cells, alice.cells);

  const cells2 = await e2eProvider.findCells({
    lock: alicePrefixLock,
    argsLen: "any",
  });

  t.deepEqual(cells2.length, alice.cells.length + 1);
});

test("Test query cells by non exist lock script", async (t) => {
  const nonExistAccount = randomSecp256k1Account();

  const cells = await e2eProvider.findCells({
    lock: nonExistAccount.lockScript,
  });

  t.deepEqual(cells, []);
});

test("Test query cells by type script", async (t) => {
  const cells = await e2eProvider.findCells({
    type: {
      codeHash: t.context.config.SCRIPTS["DAO"]!.CODE_HASH,
      hashType: t.context.config.SCRIPTS["DAO"]!.HASH_TYPE,
      args: "0x",
    },
  });

  t.true(cells.length > 0);
});

test("Test query cells by both lock and type script and return nonempty result", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    type: {
      codeHash: t.context.config.SCRIPTS["DAO"]!.CODE_HASH,
      hashType: t.context.config.SCRIPTS["DAO"]!.HASH_TYPE,
      args: "0x",
    },
  });

  const withTypeCells = alice.cells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, withTypeCells.length);
  t.deepEqual(cells, withTypeCells);
});

test("Test query cells by both lock and empty type script", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    type: "empty",
  });

  const withTypeCells = alice.cells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, alice.cells.length - withTypeCells.length);
  t.deepEqual(
    cells,
    alice.cells.filter((cell) => cell.cellOutput.type === null)
  );
});

test("Test query cells by lock and script length range and return empty result", async (t) => {
  const alice = t.context.accounts["alice"];

  const cells = await e2eProvider.findCells({
    lock: alice.lockScript,
    scriptLenRange: ["0x0", "0x1"],
  });

  const withTypeCells = alice.cells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, alice.cells.length - withTypeCells.length);
  t.deepEqual(
    cells,
    alice.cells.filter((cell) => cell.cellOutput.type === null)
  );
});
