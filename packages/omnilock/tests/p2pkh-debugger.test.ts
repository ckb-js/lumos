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
      path: path.join(__dirname, "deps/always_success"),
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
  const omniLock = registry.newScript("OMNI_LOCK", "0x");

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

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(omniLock),
  });

  t.is(result.code, 0);
  t.regex(result.message, /Run result: 0/);
  t.regex(result.message, /Total cycles consumed: 539/);
});
