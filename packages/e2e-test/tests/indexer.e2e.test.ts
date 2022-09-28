import anyTest, { TestInterface } from "ava";
import {
  generateHDAccount,
  loadConfig,
  findCells,
  waitTransactionCommitted,
  HDAccount,
  waitBlockByNumber,
  daoDeposit,
  defaultIndexer,
  defaultRPC,
} from "../src/utils";
import { join } from "path";
import { FaucetProvider } from "../src/faucetProvider";
import { FileFaucetQueue } from "../src/faucetQueue";
import { BI } from "@ckb-lumos/bi";
import { Cell, Script } from "@ckb-lumos/base";
import { encodeToAddress } from "@ckb-lumos/helpers";
import { Config } from "@ckb-lumos/config-manager";

interface TestContext {
  account: HDAccount;
  cellsMap: Record<HDAccount["address"], Cell[]>;
  faucetProvider: FaucetProvider;
  config: Config;
}

const test = anyTest as TestInterface<TestContext>;
const rpc = defaultRPC;
const ckbIndexer = defaultIndexer;

test.before(async (t) => {
  const config = await loadConfig();
  const alice = generateHDAccount();
  const faucetProvider = new FaucetProvider({
    queue: new FileFaucetQueue(join(__dirname, "../tmp/")),
  });

  const txHashes = await Promise.all([
    faucetProvider.claimCKB(alice.address, 1000),
    faucetProvider.claimCKB(alice.address, 1000),
  ]);

  await Promise.all(txHashes.map((txHash) => waitTransactionCommitted(txHash)));

  const currentBlockNumber = await rpc.getTipBlockNumber();
  await waitBlockByNumber(BI.from(currentBlockNumber).add(1).toNumber());

  await Promise.all(
    (
      await Promise.all([
        faucetProvider.claimCKB(alice.address, 1000),
        faucetProvider.claimCKB(alice.address, 1000),
        faucetProvider.claimCKB(alice.address, 1000),
      ])
    ).map((txHash) => waitTransactionCommitted(txHash))
  );

  await waitTransactionCommitted(await daoDeposit({ fromPk: alice.privKey }));

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    order: "asc",
  });

  t.context = {
    account: alice,
    cellsMap: { [alice.address]: cells },
    faucetProvider,
    config,
  };
});

test.after(async (t) => {
  t.context.faucetProvider.end();
});

test("Test query cells by lock script", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];
  const cells = await findCells(ckbIndexer, { lock: alice.lockScript });

  t.deepEqual(cells.length, aliceCells.length);
  t.deepEqual(cells, aliceCells);
});

test("Test query cells by lock script script and between block range", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const fromBlock = aliceCells[2].blockNumber!;
  const toBlock = aliceCells[4].blockNumber!;

  const cells = await findCells(ckbIndexer, {
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
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    skip: 2,
  });

  t.deepEqual(cells.length, aliceCells.length - 2);
  t.deepEqual(cells, aliceCells.slice(2));
});

test("Test query cells by lock script and return the cells in desc order", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    order: "desc",
  });

  t.deepEqual(cells.length, aliceCells.length);
  t.deepEqual(cells, [...aliceCells].reverse());
});

test("Test query cells by lock script, return the cells in desc order then skip the first 2 cells", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    skip: 2,
    order: "desc",
  });

  t.deepEqual(cells.length, aliceCells.length - 2);
  t.deepEqual(cells, [...aliceCells].reverse().slice(2));
});

test("Test query cells by lock script with argsLen as number", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const alicePrefixLock: Script = {
    ...alice.lockScript,
    args: alice.lockScript.args.slice(0, 20), // length: 9
  };

  const alicePrefixAccount = encodeToAddress(alicePrefixLock);
  await waitTransactionCommitted(
    await t.context.faucetProvider.claimCKB(alicePrefixAccount)
  );

  const cells = await findCells(ckbIndexer, {
    lock: alicePrefixLock,
    argsLen: 20,
  });

  t.deepEqual(cells.length, aliceCells.length);
  t.deepEqual(cells, aliceCells);

  const cells2 = await findCells(ckbIndexer, {
    lock: alicePrefixLock,
    argsLen: "any",
  });

  t.deepEqual(cells2.length, aliceCells.length + 1);
});

test("Test query cells by non exist lock script", async (t) => {
  const nonExistAccount = generateHDAccount();

  const cells = await findCells(ckbIndexer, {
    lock: nonExistAccount.lockScript,
  });

  t.deepEqual(cells, []);
});

test("Test query cells by type script", async (t) => {
  const cells = await findCells(ckbIndexer, {
    type: {
      codeHash: t.context.config.SCRIPTS["DAO"]!.CODE_HASH,
      hashType: t.context.config.SCRIPTS["DAO"]!.HASH_TYPE,
      args: "0x",
    },
  });

  t.true(cells.length > 0);
});

test("Test query cells by both lock and type script and return nonempty result", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    type: {
      codeHash: t.context.config.SCRIPTS["DAO"]!.CODE_HASH,
      hashType: t.context.config.SCRIPTS["DAO"]!.HASH_TYPE,
      args: "0x",
    },
  });

  const withTypeCells = aliceCells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, withTypeCells.length);
  t.deepEqual(cells, withTypeCells);
});

test("Test query cells by both lock and empty type script", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    type: "empty",
  });

  const withTypeCells = aliceCells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, aliceCells.length - withTypeCells.length);
  t.deepEqual(
    cells,
    aliceCells.filter((cell) => cell.cellOutput.type === null)
  );
});

test("Test query cells by lock and script length range and return empty result", async (t) => {
  const alice = t.context.account;
  const aliceCells = t.context.cellsMap[alice.address];

  const cells = await findCells(ckbIndexer, {
    lock: alice.lockScript,
    scriptLenRange: ["0x0", "0x1"],
  });

  const withTypeCells = aliceCells.filter((cell) => cell.cellOutput.type);

  t.deepEqual(cells.length, aliceCells.length - withTypeCells.length);
  t.deepEqual(
    cells,
    aliceCells.filter((cell) => cell.cellOutput.type === null)
  );
});
