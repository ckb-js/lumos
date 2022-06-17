import test from "ava";
import {
  createCellWithMinimalCapacity,
  createScriptRegistry,
} from "@ckb-lumos/experiment-tx-assembler";
import * as path from "path";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { loadCode } from "../src/loader";
import { ScriptConfig } from "@ckb-lumos/config-manager";
import { HexString } from "@ckb-lumos/base";
import { CKBDebugger } from "../src";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { mockOutPoint } from "../src/mock";
import { DataLoader } from "../src/types";

const ALWAYS_SUCCESS_CODE = loadCode(
  path.join(__dirname, "deps/always_success")
);

const ALWAYS_SUCCESS: ScriptConfig = {
  CODE_HASH: ALWAYS_SUCCESS_CODE.codeHash,
  DEP_TYPE: "code",
  HASH_TYPE: "data",
  INDEX: "0x0",
  TX_HASH: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

const EMPTY_LOADER: DataLoader = {
  getHeader() {
    throw new Error("unimplemented");
  },
  getCellData(): HexString {
    throw new Error("unimplemented");
  },
};

test("debugger#CKBDebugger without debugger path", (t) => {
  const origin = process.env.CKB_DEBUGGER_PATH;
  delete process.env.CKB_DEBUGGER_PATH;

  t.throws(() => new CKBDebugger({ loader: EMPTY_LOADER }));

  process.env.CKB_DEBUGGER_PATH = origin;
});

// TODO uncomment the skip when ci is ready
test.skip("debugger#CKBDebugger with always_success", async (t) => {
  const registry = createScriptRegistry({ ALWAYS_SUCCESS });

  const debug = new CKBDebugger({
    loader: {
      getHeader: () => {
        throw new Error("unimplemented");
      },
      getCellData(): HexString {
        return ALWAYS_SUCCESS_CODE.binary;
      },
    },
    // TODO replace with real config here or set CKB_DEBUGGER_PATH
    // debuggerPath: "/Users/crypto/Downloads/ckb-debugger-macos-x64/ckb-debugger",
  });

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

  const result = await debug.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(alwaysSuccessLock),
  });

  t.is(result.code, 0);
  t.regex(result.message, /Run result: 0/);
  t.regex(result.message, /Total cycles consumed: 539/);
});

test.todo("debugger#CKBDebugger with always_fail");
test.todo("debugger#CKBDebugger with secp256k1 with correct signature");
test.todo("debugger#CKBDebugger with secp256k1 with wrong signature");
test.todo("debugger#CKBDebugger with transfer sUDT");
