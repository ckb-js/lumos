import test from "ava";
import { prepareCobuildSighashSigningEntries, sealTransaction } from "../src";
import { createTestContext, getDefaultConfig } from "@ckb-lumos/debugger";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { randomBytes } from "node:crypto";
import { privateKeyToBlake160, signRecoverable } from "@ckb-lumos/hd/lib/key";
import { Cell, Script } from "@ckb-lumos/base";
import { common, omnilock } from "@ckb-lumos/common-scripts";
import { mockOutPoint } from "@ckb-lumos/debugger/lib/context";
import { bytes, PackParam } from "@ckb-lumos/codec";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { sealCobuildBlake2bFlow } from "@ckb-lumos/common-scripts/lib/omnilock-cobuild";
import { Message } from "../src/codec";

const context = createTestContext(getDefaultConfig());

const testConfig = {
  config: { SCRIPTS: context.scriptConfigs, PREFIX: "ckt" },
};

const pk1 = bytes.hexify(randomBytes(32));
const args1 = privateKeyToBlake160(pk1);
const secp256k1Blake160Lock1: Script = {
  codeHash: context.scriptConfigs.SECP256K1_BLAKE160.CODE_HASH,
  hashType: context.scriptConfigs.SECP256K1_BLAKE160.HASH_TYPE,
  args: args1,
};
const omnilock1 = omnilock.createOmnilockScript(
  { auth: { flag: "SECP256K1_BLAKE160", content: args1 } },
  testConfig
);

test("Omnilock without the CoBuild message", async (t) => {
  const txSkeleton = TransactionSkeleton().asMutable();

  const cell: Cell = {
    cellOutput: { lock: omnilock1, capacity: "0x111111111" },
    data: "0x",
    outPoint: mockOutPoint(),
  };

  await common.setupInputCell(txSkeleton, cell, undefined, testConfig);

  prepareCobuildSighashSigningEntries(txSkeleton, () => true);
  t.is(txSkeleton.signingEntries.size, 1);

  const digest = txSkeleton.signingEntries.get(0)!.message;
  const signature = signRecoverable(digest, bytes.hexify(pk1));

  const signed = sealTransaction(txSkeleton, [
    sealCobuildBlake2bFlow({ signature }),
  ]);

  txSkeleton.update("witnesses", (witnesses) =>
    witnesses.clear().push(...signed.witnesses)
  );

  const { code } = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(omnilock1),
  });

  t.is(code, 0);
});

test("Omnilock with the CoBuild message", async (t) => {
  const privateKey = randomBytes(32);
  const args = privateKeyToBlake160(bytes.hexify(privateKey));

  const lock = omnilock.createOmnilockScript(
    { auth: { flag: "SECP256K1_BLAKE160", content: args } },
    testConfig
  );
  const typeRequiresCobuild: Script = {
    codeHash: context.scriptConfigs.ALWAYS_SUCCESS.CODE_HASH,
    hashType: context.scriptConfigs.ALWAYS_SUCCESS.HASH_TYPE,
    args: "0x",
  };

  const cell: Cell = {
    cellOutput: {
      lock: lock,
      type: typeRequiresCobuild,
      capacity: "0x111111111",
    },
    data: "0x",
    outPoint: mockOutPoint(),
  };

  const txSkeleton = TransactionSkeleton().asMutable();
  await common.setupInputCell(txSkeleton, cell, undefined, testConfig);

  const cobuildMessage: PackParam<typeof Message> = {
    actions: [
      {
        scriptHash: computeScriptHash(typeRequiresCobuild),
        data: randomBytes(32),
        scriptInfoHash: randomBytes(32),
      },
    ],
  };

  prepareCobuildSighashSigningEntries(txSkeleton, () => true, cobuildMessage);

  t.is(txSkeleton.signingEntries.size, 1);

  const digest = txSkeleton.signingEntries.get(0)!.message;
  const signature = signRecoverable(digest, bytes.hexify(privateKey));

  const signed = sealTransaction(
    txSkeleton,
    [sealCobuildBlake2bFlow({ signature })],
    cobuildMessage
  );

  txSkeleton.update("witnesses", (witnesses) =>
    witnesses.clear().push(...signed.witnesses)
  );

  const { code } = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(lock),
  });

  t.is(code, 0);
});

test("Cobuild works with legacy WitnessArgs", async (t) => {
  const txSkeleton = TransactionSkeleton().asMutable();

  const omnilockCell: Cell = {
    cellOutput: { lock: omnilock1, capacity: "0x111111111" },
    data: "0x",
    outPoint: mockOutPoint(),
  };

  const secp256k1Cell: Cell = {
    cellOutput: { lock: secp256k1Blake160Lock1, capacity: "0x111111111" },
    data: "0x",
    outPoint: mockOutPoint(),
  };

  await common.setupInputCell(txSkeleton, omnilockCell, undefined, testConfig);
  await common.setupInputCell(txSkeleton, secp256k1Cell, undefined, testConfig);

  common.prepareSigningEntries(txSkeleton, testConfig);
  // secp256k1Blake160 and omnilock
  t.is(txSkeleton.signingEntries.size, 2);

  // prepare
  prepareCobuildSighashSigningEntries(
    txSkeleton,
    (script) => script.codeHash === testConfig.config.SCRIPTS.OMNILOCK.CODE_HASH
  );

  // secp256k1Blake160 and omnilock
  t.is(
    txSkeleton.signingEntries.size,
    2,
    "the cobuild prepareCobuildSighashSigningEntries should remove the existed WitnessLayoutEntry"
  );
  const witnessLayoutEntries = txSkeleton.signingEntries.filter(
    ({ type }) => type === "witness_layout_lock"
  );
  t.is(witnessLayoutEntries.size, 1);

  const digest0 = txSkeleton.signingEntries.get(0)!.message;
  const signature0 = signRecoverable(digest0, pk1);

  const digest1 = txSkeleton.signingEntries.get(1)!.message;
  const signature1 = signRecoverable(digest1, pk1);

  const signed = sealTransaction(txSkeleton, [
    sealCobuildBlake2bFlow({ signature: signature0 }),
    signature1,
  ]);

  txSkeleton.update("witnesses", (witnesses) =>
    witnesses.clear().push(...signed.witnesses)
  );

  const { code: omnilockResult } = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(omnilock1),
  });

  t.is(omnilockResult, 0);

  const { code: secp256k1Blake160Result } = await context.executor.execute(
    txSkeleton,
    {
      scriptGroupType: "lock",
      scriptHash: computeScriptHash(secp256k1Blake160Lock1),
    }
  );

  t.is(secp256k1Blake160Result, 0);
});
