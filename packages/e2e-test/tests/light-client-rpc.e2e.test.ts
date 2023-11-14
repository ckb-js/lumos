import anyTest, { TestInterface } from "ava";
import { asyncSleep, randomSecp256k1Account, Account } from "../src/utils";
import { CKB_RPC_URL, LIGHT_CLIENT_RPC_URL } from "../src/constants";
import { E2EProvider } from "../src/e2eProvider";
import { FileFaucetQueue } from "../src/faucetQueue";
import { Cell, Script } from "@ckb-lumos/base";
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

function isEqual(a: Script, b: Script) {
  return (
    a.codeHash === b.codeHash && a.hashType === b.hashType && a.args === b.args
  );
}

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

async function waitLightClientFetchHeader(
  lightClientRpc: LightClientRPC,
  blockHash: string
) {
  let notFoundCount = 0;
  while (true) {
    const result = await lightClientRpc.fetchHeader(blockHash);

    if (result.status === FetchFlag.NotFound) {
      if (notFoundCount > 3) {
        throw new Error("block not found");
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
    e2eProvider.claimCKB({ claimer: alice.address }),
  ]);

  await e2eProvider.waitForBlock({
    relative: true,
    value: 1,
  });

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

test("light-client get_tip_header rpc", async (t) => {
  const tipHeader = await lightClientRPC.getTipHeader();
  t.true(typeof tipHeader.dao === "string");
  t.true(typeof tipHeader.number == "string");
  t.true(typeof tipHeader.hash == "string");
});

test("light-client get_peers rpc", async (t) => {
  const peers = await lightClientRPC.getPeers();
  t.true(Array.isArray(peers));
  t.true(Array.isArray(peers[0].addresses));
  t.true(Array.isArray(peers[0].protocols));
  t.true(typeof peers[0].connectedDuration == "string");
  t.true(typeof peers[0].nodeId == "string");
  t.true(typeof peers[0].version == "string");
});

test("light-client local_node_info rpc", async (t) => {
  const nodeInfo = await lightClientRPC.localNodeInfo();
  t.true(typeof nodeInfo.active == "boolean");
  t.true(typeof nodeInfo.connections == "string");
  t.true(typeof nodeInfo.nodeId == "string");
  t.true(typeof nodeInfo.version == "string");
  t.true(Array.isArray(nodeInfo.addresses));
  t.true(Array.isArray(nodeInfo.protocols));
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

test.serial("light-client get_transactions rpc", async (t) => {
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

  const ungrouped = await lightClientRPC.getTransactions(
    {
      script: alice.lockScript,
      scriptType: "lock",
    },
    "asc",
    "0x64"
  );

  t.deepEqual(ungrouped.objects.length, alice.cells.length);
  t.deepEqual(
    ungrouped.objects.map((obj) => obj.blockNumber),
    alice.cells.map((cell) => cell.blockNumber)
  );

  const grouped = await lightClientRPC.getTransactions(
    {
      script: alice.lockScript,
      scriptType: "lock",
      groupByTransaction: true,
    },
    "asc",
    "0x64"
  );

  t.deepEqual(grouped.objects.length, alice.cells.length);
  grouped.objects.map((obj) =>
    obj.cells.map(([ioType]) => {
      t.deepEqual(ioType, "output");
    })
  );

  t.deepEqual(
    grouped.objects.map((o) => o.txHash),
    ungrouped.objects.map((o) => o.txHash)
  );
});

test.serial("test setScripts", async (t) => {
  const bob = randomSecp256k1Account();

  const beforeScripts = await lightClientRPC.getScripts();
  const listeningBob = beforeScripts.some((script) =>
    isEqual(script.script, bob.lockScript)
  );
  t.deepEqual(listeningBob, false);

  // partial case
  await lightClientRPC.setScripts(
    [{ script: bob.lockScript, scriptType: "lock", blockNumber: "0x0" }],
    "partial"
  );

  const afterScripts = await lightClientRPC.getScripts();

  const afterListeningBob = afterScripts.some((script) =>
    isEqual(script.script, bob.lockScript)
  );
  t.deepEqual(afterListeningBob, true);

  // delete case
  await lightClientRPC.setScripts(
    [{ script: bob.lockScript, scriptType: "lock", blockNumber: "0x0" }],
    "delete"
  );

  const deletedAfterScripts = await lightClientRPC.getScripts();

  const deletedAfterListeningBob = deletedAfterScripts.some((script) =>
    isEqual(script.script, bob.lockScript)
  );
  t.deepEqual(deletedAfterListeningBob, false);
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

test.serial("light-client fetch_header & get_header rpc", async (t) => {
  const tipHeader = await lightClientRPC.getTipHeader();
  const header = await waitLightClientFetchHeader(
    lightClientRPC,
    tipHeader.hash
  );
  t.deepEqual(header, tipHeader);

  const gotHeader = await lightClientRPC.getHeader(tipHeader.hash);
  t.deepEqual(gotHeader, tipHeader);
});

test.serial(
  "light-client fetch_transaction & get_transaction rpc",
  async (t) => {
    const alice = randomSecp256k1Account();
    const txHash = await e2eProvider.claimCKB({ claimer: alice.address });

    const tx = await waitLightClientFetchTransaction(lightClientRPC, txHash);
    t.deepEqual(tx.transaction.hash, txHash);
    t.true(typeof tx.txStatus.status == "string");

    const gotTx = await lightClientRPC.getTransaction(txHash);
    t.deepEqual(gotTx.transaction.hash, txHash);
    t.true(typeof tx.txStatus.status == "string");
  }
);

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
