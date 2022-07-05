import test from "ava";
import * as path from "path";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { CKBDebuggerDownloader, createTestContext } from "@ckb-lumos/debugger";
import {
  createCellWithMinimalCapacity,
  createScriptRegistry,
} from "@ckb-lumos/experiment-tx-assembler";
import { mockOutPoint } from "@ckb-lumos/debugger/lib/context";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { createDefaultOmnilockSuite } from "../src/suite";
import { key } from "@ckb-lumos/hd";
import { AuthByP2PKH } from "../src/types";
import { initializeConfig } from "@ckb-lumos/config-manager/lib";
const downloader = new CKBDebuggerDownloader();
const context = createTestContext({
  deps: {
    SECP256K1_BLAKE160: {
      dep_type: "dep_group",
      path: path.join(__dirname, "deps/secp256k1_blake160"),
      includes: [path.join(__dirname, "deps/secp256k1_data_info")],
    },
    OMNI_LOCK: {
      dep_type: "code",
      path: path.join(__dirname, "deps/rc_lock"),
    },
    // https://github.com/nervosnetwork/ckb/blob/develop/script/testdata/debugger.c
    DEBUGGER: {
      // the dep_type is defaults to "code"
      // dep_type: "code",
      path: path.join(__dirname, "deps/debugger"),
    },
  },
});

const registry = createScriptRegistry(context.scriptConfigs);
test.before(async () => {
  if (process.env.CKB_DEBUGGER_PATH) return;
  await downloader.downloadIfNotExists();
});

test("p2pkh#CKBDebugger with omnilock", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  initializeConfig({ PREFIX: "ckt", SCRIPTS: context.scriptConfigs });
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceAddress = key.privateKeyToBlake160(ALICE_PRIVKEY);
  console.log("alice eth address is:", aliceAddress);

  const auth: AuthByP2PKH = {
    authFlag: "SECP256K1_BLAKE160",
    options: { pubkeyHash: aliceAddress },
  };
  const suite = createDefaultOmnilockSuite({
    authHints: [auth],
    scriptConfig: context.scriptConfigs.OMNI_LOCK,
  });

  const aliceLock = suite.createOmnilockScript({ auth });

  const omniLock = registry.newScript("OMNI_LOCK", aliceLock.args);

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      out_point: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: omniLock }),
    })
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: omniLock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("OMNI_LOCK"))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("SECP256K1_BLAKE160"))
  );

  txSkeleton = (await suite.adjust(txSkeleton)).adjusted;

  txSkeleton = await suite.seal(txSkeleton, (entry) =>
    key.signRecoverable(entry.message, ALICE_PRIVKEY)
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(omniLock),
  });

  t.is(result.code, 0);
  t.regex(result.message, /Run result: 0/);

  t.regex(result.message, /Total cycles consumed: 14[\d5]/);
});
