import test from "ava";
import { Config } from "@ckb-lumos/config-manager";
import hd from "@ckb-lumos/hd";
import { computeScriptHash } from "@ckb-lumos/base/lib/utils";
import { Script } from "@ckb-lumos/base";
import * as helpers from "@ckb-lumos/helpers";
import { CKBDebuggerDownloader } from "@ckb-lumos/debugger";
import {
  createTestContext,
  getDefaultConfig,
} from "@ckb-lumos/debugger/lib/context";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { common, omnilock } from "@ckb-lumos/common-scripts";
import { WitnessArgs } from "@ckb-lumos/codec/lib/blockchain";
import { CellProvider } from "./cell_provider";
import { charlesOmnilockInputs } from "./inputs";
import { bytes } from "@ckb-lumos/codec";

const downloader = new CKBDebuggerDownloader();
const context = createTestContext(getDefaultConfig());
const ckbConfig: Config = {
  PREFIX: "ckt",
  SCRIPTS: context.scriptConfigs,
};

test.before(async () => {
  if (process.env.CKB_DEBUGGER_PATH) return;
  await downloader.downloadIfNotExists();
});

test("omnilock#common transfer", async (t) => {
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = hd.key.privateKeyToBlake160(ALICE_PRIVKEY);
  const aliceOmnilock: Script = omnilock.createOmnilockScript(
    {
      auth: {
        flag: "SECP256K1_BLAKE160",
        content: aliceArgs,
      },
    },
    { config: ckbConfig }
  );
  const aliceSecplock: Script = {
    codeHash: ckbConfig.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
    hashType: ckbConfig.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
    args: aliceArgs,
  };
  const aliceOmnilockAddress = helpers.encodeToAddress(aliceOmnilock, {
    config: ckbConfig,
  });
  const aliceSecplockAddress = helpers.encodeToAddress(aliceSecplock, {
    config: ckbConfig,
  });
  const cellProvider = new CellProvider([...charlesOmnilockInputs]);
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider });
  txSkeleton = await common.transfer(
    txSkeleton,
    [aliceOmnilockAddress],
    aliceSecplockAddress,
    BigInt(70 * 10 ** 8),
    undefined,
    undefined,
    { config: ckbConfig }
  );

  txSkeleton = await common.payFee(
    txSkeleton,
    [aliceOmnilockAddress],
    1000,
    undefined,
    { config: ckbConfig }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: ckbConfig });
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const sig = hd.key.signRecoverable(message, ALICE_PRIVKEY);
  const omnilockSig = bytes.hexify(
    omnilock.OmnilockWitnessLock.pack({ signature: sig })
  );
  txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
    witnesses.set(0, hexify(WitnessArgs.pack({ lock: omnilockSig })))
  );
  const result = await context.executor.execute(txSkeleton, {
    scriptGroupType: "lock",
    scriptHash: computeScriptHash(aliceOmnilock),
  });
  t.is(result.code, 0);
  t.regex(result.message, /Run result: 0/);
});

test("should createOmnilockScript fail if invalid config provided", (t) => {
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = hd.key.privateKeyToBlake160(ALICE_PRIVKEY);

  const invalidCkbConfig: Config = {
    PREFIX: "ckt",
    SCRIPTS: {},
  };

  const error = t.throws(
    () => {
      omnilock.createOmnilockScript(
        {
          auth: {
            flag: "SECP256K1_BLAKE160",
            content: aliceArgs,
          },
        },
        { config: invalidCkbConfig }
      );
    },
    { instanceOf: Error }
  );
  t.is(error.message, "OMNILOCK script config not found.");
});

test("should createOmnilockScript fail if non supportted omnilock auth flag used", (t) => {
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = hd.key.privateKeyToBlake160(ALICE_PRIVKEY);

  const error = t.throws(
    () => {
      omnilock.createOmnilockScript(
        {
          auth: {
            flag: "PW_Lock" as any,
            content: aliceArgs,
          },
        },
        { config: ckbConfig }
      );
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Not supported flag: PW_Lock.");
});
