import test from "ava";
import { refreshScriptConfigs } from "../src/refresh";
import { ScriptConfigs } from "../src";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { randomBytes } from "node:crypto";

function randomHash() {
  return hexify(randomBytes(32));
}

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
