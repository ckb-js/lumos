import test from "ava";
import {
  createLatestTypeIdResolver,
  FetchOutputsByTxHashes,
  refreshScriptConfigs,
} from "../src/refresh";
import { ScriptConfigs } from "../src";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { randomBytes } from "node:crypto";
import { OutPoint, Output, Script } from "@ckb-lumos/base";
import sinon from "sinon";

test("refresh without update", async (t) => {
  const scriptConfigs: ScriptConfigs = {
    A: {
      CODE_HASH: randomHash(),
      TX_HASH: randomHash(),
      HASH_TYPE: "type",
      DEP_TYPE: "code",
      INDEX: "0x1",
    },
    B: {
      CODE_HASH: randomHash(),
      TX_HASH: randomHash(),
      HASH_TYPE: "type",
      DEP_TYPE: "code",
      INDEX: "0x1",
    },
  };
  const refreshed1 = await refreshScriptConfigs(scriptConfigs, {
    resolve: (outPoints) => outPoints,
  });

  t.deepEqual(refreshed1, scriptConfigs);
});

test("refresh with skip", async (t) => {
  const scriptConfigs: ScriptConfigs = {
    A: {
      CODE_HASH: randomHash(),
      TX_HASH: randomHash(),
      HASH_TYPE: "type",
      DEP_TYPE: "code",
      INDEX: "0x1",
    },
    B: {
      CODE_HASH: randomHash(),
      TX_HASH: randomHash(),
      HASH_TYPE: "type",
      DEP_TYPE: "code",
      INDEX: "0x1",
    },
  };
  const refreshed2 = await refreshScriptConfigs(scriptConfigs, {
    resolve: async (outPoints) =>
      outPoints.map(() => ({ txHash: randomHash(), index: "0x0" })),
    skip: ["B"],
  });

  t.notDeepEqual(scriptConfigs.A, refreshed2.A);
  t.deepEqual(scriptConfigs.B, refreshed2.B);
});

test("resolve empty outpoints should be empty", async (t) => {
  const resolve = createLatestTypeIdResolver(
    (hashes) => hashes.map(() => ({ outputs: [randomOutput()] })),
    (scripts) => scripts.map(() => ({ outPoint: randomOutPoint() }))
  );

  t.deepEqual([], await resolve([]));
});

test("LatestTypeIdResolver should work as expected", async (t) => {
  const originalOutPoint = randomOutPoint();
  const originalOutput = randomOutput();
  const latestOutPoint = randomOutPoint();

  const fetchOutputsByTxHashes = sinon.spy((hashes) => {
    return hashes.map(() => ({ outputs: [originalOutput] }));
  });

  const fetchLatestTypeIdOutPoints = sinon.spy((scripts) =>
    scripts.map(() => ({ outPoint: latestOutPoint }))
  );

  const resolve = createLatestTypeIdResolver(
    fetchOutputsByTxHashes,
    fetchLatestTypeIdOutPoints
  );

  const resolved = await resolve([originalOutPoint]);

  t.true(fetchOutputsByTxHashes.calledWith([originalOutPoint.txHash]));
  t.true(fetchLatestTypeIdOutPoints.calledWith([originalOutput.type]));
  t.deepEqual(resolved, [latestOutPoint]);
});

test("should resolve as original OutPoint if type script is empty", async (t) => {
  const originalOutPoint = randomOutPoint();

  const fetchOutputsByTxHashes = sinon.spy(((hashes: string[]) =>
    hashes.map(() => ({
      outputs: [{ capacity: "0x0", lock: randomScript() }],
    }))) satisfies FetchOutputsByTxHashes);

  const resolve = createLatestTypeIdResolver(fetchOutputsByTxHashes, () => []);
  const resolved = await resolve([originalOutPoint]);
  t.deepEqual(resolved, [originalOutPoint]);
});

function randomOutPoint(): OutPoint {
  return { txHash: randomHash(), index: "0x0" };
}

function randomOutput(): Output {
  return {
    capacity: randomHex(8),
    type: randomScript(),
    lock: randomScript(),
  };
}

function randomScript(): Script {
  return {
    codeHash: randomHash(),
    hashType: "type",
    args: hexify(randomBytes(20)),
  };
}

function randomHash() {
  return randomHex(32);
}

function randomHex(size: number) {
  return hexify(randomBytes(size));
}
