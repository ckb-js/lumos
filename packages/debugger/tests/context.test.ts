import test from "ava";
import {
  createCellWithMinimalCapacity,
  createScriptRegistry,
} from "@ckb-lumos/experiment-tx-assembler";
import * as path from "path";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { HexString } from "@ckb-lumos/base";
import { CKBDebugger, CKBDebuggerDownloader } from "../src";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { createTestContext, mockOutPoint } from "../src/context";
import { DataLoader } from "../src/types";

const downloader = new CKBDebuggerDownloader();
const context = createTestContext({
  deps: {
    ALWAYS_SUCCESS: { path: path.join(__dirname, "deps/always_success") },
    ALWAYS_FAILURE: { path: path.join(__dirname, "deps/always_failure") },
  },
});

const registry = createScriptRegistry(context.scriptConfigs);

const EMPTY_LOADER: DataLoader = {
  getHeader() {
    throw new Error("unimplemented");
  },
  getCellData(): HexString {
    throw new Error("unimplemented");
  },
};

test.before(async () => {
  if (process.env.CKB_DEBUGGER_PATH) return;
  await downloader.downloadIfNotExists();
});

test("debugger#CKBDebugger without debugger path", (t) => {
  const origin = process.env.CKB_DEBUGGER_PATH;
  delete process.env.CKB_DEBUGGER_PATH;

  t.throws(() => new CKBDebugger({ loader: EMPTY_LOADER }));

  process.env.CKB_DEBUGGER_PATH = origin;
});

// TODO uncomment the skip when ci is ready
test("debugger#CKBDebugger with always_success", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const alwaysSuccessLock = registry.newScript("ALWAYS_SUCCESS", "0x");

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      out_point: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: alwaysSuccessLock }),
    })
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: alwaysSuccessLock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("ALWAYS_SUCCESS"))
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(alwaysSuccessLock),
  });

  t.is(result.code, 0);
  t.regex(result.message, /Run result: 0/);
  t.regex(result.message, /Total cycles consumed: 539/);
});

test("debugger#CKBDebugger with always_fail", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const alwaysFailureLock = registry.newScript("ALWAYS_FAILURE", "0x");

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      out_point: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: alwaysFailureLock }),
    })
  );
  txSkeleton = txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: alwaysFailureLock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("ALWAYS_FAILURE"))
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(alwaysFailureLock),
  });

  t.is(result.code, -1);
  t.regex(result.message, /Run result: -1/);
});

test.todo("debugger#CKBDebugger with secp256k1 with correct signature");
test.todo("debugger#CKBDebugger with secp256k1 with wrong signature");
test.todo("debugger#CKBDebugger with transfer sUDT");
