import anyTest, { TestInterface } from "ava";
import { asyncSleep, generateHDAccount, HDAccount } from "../src/utils";
import { CKB_RPC_URL, LIGHT_CLIENT_RPC_URL } from "../src/constants";
import { E2EProvider } from "../src/e2eProvider";
import { join } from "path";
import { FileFaucetQueue } from "../src/faucetQueue";
import { Cell } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import {
  CellCollector,
  Indexer,
  TerminableCellAdapter,
} from "@ckb-lumos/ckb-indexer";
import { LightClientRPC } from "@ckb-lumos/light-client";
import { isEqual } from "lodash";

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
const indexer = new Indexer(CKB_RPC_URL);
const lightClientRPC = new LightClientRPC(LIGHT_CLIENT_RPC_URL);
const faucetQueue = new FileFaucetQueue(join(__dirname, "../tmp/"));
const e2eProvider = new E2EProvider({ indexer, rpc, faucetQueue: faucetQueue });

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

test.before(async (t) => {
  const config = await e2eProvider.loadLocalConfig();
  const alice = generateHDAccount();

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

test("test setScripts", async (t) => {
  const bob = generateHDAccount();

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

test("test lightClient getCells by Cellcollector", async (t) => {
  const alice = t.context.accounts["alice"];

  await lightClientRPC.setScripts([
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
