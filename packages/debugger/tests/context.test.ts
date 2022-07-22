import test from "ava";
import {
  createCellWithMinimalCapacity,
  createScriptRegistry,
} from "@ckb-lumos/experiment-tx-assembler";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { HexString } from "@ckb-lumos/base";
import { CKBDebugger, CKBDebuggerDownloader, DataLoader } from "../src";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import {
  createTestContext,
  getDefaultConfig,
  mockOutPoint,
} from "../src/context";
import { randomBytes } from "crypto";
import { privateKeyToBlake160, signRecoverable } from "@ckb-lumos/hd/lib/key";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import {
  createP2PKHMessageGroup,
  parseFromInfo,
} from "@ckb-lumos/common-scripts";
import { WitnessArgs } from "@ckb-lumos/codec/lib/blockchain";

const downloader = new CKBDebuggerDownloader();
const context = createTestContext(getDefaultConfig());

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

test("context#CKBDebugger without debugger path", (t) => {
  const origin = process.env.CKB_DEBUGGER_PATH;
  delete process.env.CKB_DEBUGGER_PATH;

  t.throws(() => new CKBDebugger({ loader: EMPTY_LOADER }));

  process.env.CKB_DEBUGGER_PATH = origin;
});

// TODO uncomment the skip when ci is ready
test("context#CKBDebugger with always_success", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const alwaysSuccessLock = registry.newScript("ALWAYS_SUCCESS", "0x");

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
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

test("context#CKBDebugger with always_fail", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const alwaysFailureLock = registry.newScript("ALWAYS_FAILURE", "0x");

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
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

test("context#CKBDebugger with secp256k1 with correct signature", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const pk = hexify(randomBytes(32));
  const blake160 = privateKeyToBlake160(pk);

  const secp256k1Lock = registry.newScript("SECP256K1_BLAKE160", blake160);

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: secp256k1Lock }),
    })
  );
  txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: secp256k1Lock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("SECP256K1_BLAKE160"))
  );
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.push(hexify(WitnessArgs.pack({ lock: "0x" + "00".repeat(65) })))
  );
  const signingGroup = createP2PKHMessageGroup(txSkeleton, [secp256k1Lock]);
  const signedMessage = signRecoverable(signingGroup[0].message, pk);
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.set(0, hexify(WitnessArgs.pack({ lock: signedMessage })))
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(secp256k1Lock),
  });

  t.is(result.code, 0);
  t.true(result.cycles > 0);
});

test("context#CKBDebugger with secp256k1 with wrong signature", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const pk = hexify(randomBytes(32));
  const blake160 = privateKeyToBlake160(pk);

  const secp256k1Lock = registry.newScript("SECP256K1_BLAKE160", blake160);

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: secp256k1Lock }),
    })
  );
  txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: secp256k1Lock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("SECP256K1_BLAKE160"))
  );

  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.push(hexify(WitnessArgs.pack({ lock: "0x" + "00".repeat(65) })))
  );
  const signingGroup = createP2PKHMessageGroup(txSkeleton, [secp256k1Lock]);
  const wrongPK = hexify(randomBytes(32));
  const signedMessage = signRecoverable(signingGroup[0].message, wrongPK);

  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.set(0, hexify(WitnessArgs.pack({ lock: signedMessage })))
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(secp256k1Lock),
  });

  t.is(result.code, -31);
  t.true(result.cycles > 0);
});

test("context#CKBDebugger with printf debug message", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const debugScript = registry.newScript("DEBUGGER", "0x");

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: debugScript }),
    })
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("DEBUGGER"))
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(debugScript),
  });

  t.regex(result.debugMessage, /debugger print utf-8 string/);
  t.is(result.code, 0);
});

test("context#CKBDebugger with secp256k1 multisig with correct signature", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const alicePk = hexify(randomBytes(32));
  const bobPk = hexify(randomBytes(32));
  const charlesPk = hexify(randomBytes(32));
  const alicePubkey = privateKeyToBlake160(alicePk);
  const bobPubkey = privateKeyToBlake160(bobPk);
  const charlesPubkey = privateKeyToBlake160(charlesPk);

  const { fromScript, multisigScript } = parseFromInfo(
    {
      R: 2,
      M: 2,
      publicKeyHashes: [alicePubkey, bobPubkey, charlesPubkey],
    },
    {
      config: {
        PREFIX: "ckt",
        SCRIPTS: context.scriptConfigs,
      },
    }
  );

  const multisigLock = registry.newScript(
    "SECP256K1_BLAKE160_MULTISIG",
    fromScript.args
  );

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: multisigLock }),
    })
  );
  txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: multisigLock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("SECP256K1_BLAKE160_MULTISIG"))
  );
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.push(
      hexify(
        WitnessArgs.pack({ lock: `${multisigScript}${"00".repeat(65 * 2)}` })
      )
    )
  );
  const signingGroup = createP2PKHMessageGroup(txSkeleton, [multisigLock]);
  const aliceSignedMessage = signRecoverable(signingGroup[0].message, alicePk);
  const bobSignedMessage = signRecoverable(signingGroup[0].message, bobPk);
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.set(
      0,
      hexify(
        WitnessArgs.pack({
          lock: `${multisigScript}${aliceSignedMessage.slice(
            2
          )}${bobSignedMessage.slice(2)}`,
        })
      )
    )
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(multisigLock),
  });

  t.is(result.code, 0);
  t.true(result.cycles > 0);
});

test("context#CKBDebugger with secp256k1 multisig with wrong signature", async (t) => {
  let txSkeleton = TransactionSkeleton({});
  const alicePk = hexify(randomBytes(32));
  const bobPk = hexify(randomBytes(32));
  const charlesPk = hexify(randomBytes(32));
  const alicePubkey = privateKeyToBlake160(alicePk);
  const bobPubkey = privateKeyToBlake160(bobPk);
  const charlesPubkey = privateKeyToBlake160(charlesPk);

  const { fromScript, multisigScript } = parseFromInfo(
    {
      R: 2,
      M: 2,
      publicKeyHashes: [alicePubkey, bobPubkey, charlesPubkey],
    },
    {
      config: {
        PREFIX: "ckt",
        SCRIPTS: context.scriptConfigs,
      },
    }
  );

  const multisigLock = registry.newScript(
    "SECP256K1_BLAKE160_MULTISIG",
    fromScript.args
  );

  txSkeleton = txSkeleton.update("inputs", (inputs) =>
    inputs.push({
      outPoint: mockOutPoint(),
      ...createCellWithMinimalCapacity({ lock: multisigLock }),
    })
  );
  txSkeleton.update("outputs", (outputs) =>
    outputs.push(createCellWithMinimalCapacity({ lock: multisigLock }))
  );
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(registry.newCellDep("SECP256K1_BLAKE160_MULTISIG"))
  );
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.push(
      hexify(
        WitnessArgs.pack({ lock: `${multisigScript}${"00".repeat(65 * 2)}` })
      )
    )
  );
  const signingGroup = createP2PKHMessageGroup(txSkeleton, [multisigLock]);
  const aliceSignedMessage = signRecoverable(signingGroup[0].message, alicePk);
  // use charles private key to sign
  const bobSignedMessage = signRecoverable(signingGroup[0].message, charlesPk);
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.set(
      0,
      hexify(
        WitnessArgs.pack({
          lock: `${multisigScript}${aliceSignedMessage.slice(
            2
          )}${bobSignedMessage.slice(2)}`,
        })
      )
    )
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(multisigLock),
  });

  t.is(result.code, -52);
});

test.todo("context#CKBDebugger with transfer sUDT");
