import anyTest, { TestInterface } from "ava";
import { asyncSleep, randomSecp256k1Account, Account } from "../src/utils";
import { CKB_RPC_URL, LIGHT_CLIENT_RPC_URL } from "../src/constants";
import { E2EProvider } from "../src/e2eProvider";
import { FileFaucetQueue } from "../src/faucetQueue";
import { Cell } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import { common } from "@ckb-lumos/common-scripts";
import { key } from "@ckb-lumos/hd";
import { TransactionSkeleton, sealTransaction } from "@ckb-lumos/helpers";
import {
  CellCollector,
  Indexer,
  TerminableCellAdapter,
} from "@ckb-lumos/ckb-indexer";
import { LightClientRPC } from "@ckb-lumos/light-client";
import { FetchFlag } from "@ckb-lumos/light-client/lib/type";
import { isEqual } from "lodash";

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
const lightClientRPC = new LightClientRPC(LIGHT_CLIENT_RPC_URL);
const e2eProvider = new E2EProvider({
  indexer,
  rpc,
  faucetQueue: FileFaucetQueue.getInstance(),
});

async function waitLightClientPrepared(lightClientRpc: LightClientRPC) {
  while (true) {
    try {
      await lightClientRpc.getTipHeader();
      return;
    } catch (err) {
      asyncSleep(1000);
    }
  }
}

async function waitLightClientSync(
  lightClientRpc: LightClientRPC,
  targetBlockNumber: number
) {
  while (true) {
    const scripts = await lightClientRpc.getScripts();

    const done = !scripts
      .map((script) => parseInt(script.blockNumber))
      .some((n) => n < targetBlockNumber);

    if (done) {
      return;
    }

    await asyncSleep(3000);
  }
}

async function waitLightClientFetchTransaction(
  lightClientRpc: LightClientRPC,
  txHash: string
) {
  let notFoundCount = 0;
  while (true) {
    const result = await lightClientRpc.fetchTransaction(txHash);

    if (result.status === FetchFlag.NotFound) {
      if (notFoundCount > 3) {
        throw new Error("transaction not found");
      }
      notFoundCount++;
    }

    if (result.status === FetchFlag.Fetched) {
      return result.data;
    }

    await asyncSleep(3000);
  }
}

test.before(async (t) => {
  const config = await e2eProvider.loadLocalConfig();
  const alice = randomSecp256k1Account();

  await waitLightClientPrepared(lightClientRPC);

  await lightClientRPC.setScripts([
    { script: alice.lockScript, scriptType: "lock", blockNumber: "0x0" },
  ]);

  await Promise.all([
    e2eProvider.claimCKB({ claimer: alice.address }),
    e2eProvider.claimCKB({ claimer: alice.address }),
  ]);

  await e2eProvider.waitForBlock({
    relative: true,
    value: 1,
  });

  await Promise.all([e2eProvider.claimCKB({ claimer: alice.address })]);

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

test("light client get_tip_header rpc", async (t) => {
  const tipHeader = await lightClientRPC.getTipHeader();
  t.true(typeof tipHeader.dao === "string");
  t.true(typeof tipHeader.number == "string");
  t.true(typeof tipHeader.hash == "string");
});

test("light-client get_genesis_block rpc", async (t) => {
  const res = await lightClientRPC.getGenesisBlock();
  t.deepEqual(res.header.epoch, "0x0");
  t.deepEqual(res.header.timestamp, "0x0");
  t.deepEqual(
    res.header.parentHash,
    "0x0000000000000000000000000000000000000000000000000000000000000000"
  );
  t.deepEqual(res.uncles.length, 0);
});

test.serial("test setScripts", async (t) => {
  const bob = randomSecp256k1Account();

  const beforeScripts = await lightClientRPC.getScripts();
  const listeningBob = beforeScripts.some((script) =>
    isEqual(script.script, bob.lockScript)
  );
  t.deepEqual(listeningBob, false);

  await lightClientRPC.setScripts([
    ...beforeScripts,
    { script: bob.lockScript, scriptType: "lock", blockNumber: "0x0" },
  ]);

  const afterScripts = await lightClientRPC.getScripts();

  const afterListeningBob = afterScripts.some((script) =>
    isEqual(script.script, bob.lockScript)
  );
  t.deepEqual(afterListeningBob, true);
});

test.serial("test lightClient getCells by Cellcollector", async (t) => {
  const alice = t.context.accounts["alice"];

  const beforeScripts = await lightClientRPC.getScripts();
  await lightClientRPC.setScripts([
    ...beforeScripts,
    { script: alice.lockScript, scriptType: "lock", blockNumber: "0x0" },
  ]);

  await waitLightClientSync(
    lightClientRPC,
    parseInt(alice.cells[alice.cells.length - 1].blockNumber || "0x0")
  );

  const collector = new CellCollector(
    new TerminableCellAdapter(lightClientRPC),
    { lock: alice.lockScript }
  );

  const collected: Cell[] = [];
  for await (const cell of collector.collect()) {
    collected.push(cell);
  }

  t.deepEqual(collected.length, alice.cells.length);
});

test.serial("light-client get_cells_capacity rpc", async (t) => {
  const alice = t.context.accounts["alice"];

  const before = await lightClientRPC.getScripts();
  await lightClientRPC.setScripts([
    ...before,
    { script: alice.lockScript, scriptType: "lock", blockNumber: "0x0" },
  ]);

  await waitLightClientSync(
    lightClientRPC,
    parseInt(alice.cells[alice.cells.length - 1].blockNumber || "0x0")
  );

  const capacity = await e2eProvider.getCapacities(alice.address);

  const result = await lightClientRPC.getCellsCapacity({
    script: alice.lockScript,
    scriptType: "lock",
  });

  t.deepEqual(result.capacity, capacity.toHexString());
});

test.serial("light-client send_transaction rpc", async (t) => {
  const alice = randomSecp256k1Account();
  const bob = randomSecp256k1Account();

  await e2eProvider.claimCKB({ claimer: alice.address });
  const tip = await lightClientRPC.getTipHeader();

  const before = await lightClientRPC.getScripts();
  await lightClientRPC.setScripts([
    ...before,
    { script: alice.lockScript, scriptType: "lock", blockNumber: "0x0" },
  ]);

  await waitLightClientSync(lightClientRPC, parseInt(tip.number));

  const transferTx = await (async () => {
    let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

    txSkeleton = await common.transfer(
      txSkeleton,
      [alice.address],
      bob.address,
      BigInt(100 * 10 ** 8)
    );

    txSkeleton = await common.payFeeByFeeRate(
      txSkeleton,
      [alice.address],
      1000
    );

    txSkeleton = common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = key.signRecoverable(message!, alice.privKey);
    const tx = sealTransaction(txSkeleton, [Sig]);
    return tx;
  })();

  const txHash = await lightClientRPC.sendTransaction(transferTx);
  const tx = await waitLightClientFetchTransaction(lightClientRPC, txHash);
  t.deepEqual(tx.transaction.hash, txHash);
});
