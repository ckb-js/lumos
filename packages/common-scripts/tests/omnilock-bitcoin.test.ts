import test from "ava";
import {
  CKBDebuggerDownloader,
  createTestContext,
  getDefaultConfig,
} from "@ckb-lumos/debugger";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { blockchain, utils } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
import { common } from "../src";
import { mockOutPoint } from "@ckb-lumos/debugger/lib/context";
import { createOmnilockScript, OmnilockWitnessLock } from "../src/omnilock";
import { address, AddressType, core, keyring } from "@unisat/wallet-sdk";
import { NetworkType } from "@unisat/wallet-sdk/lib/network";
import { Provider, signMessage } from "../src/omnilock-bitcoin";
import { SimpleKeyring } from "@unisat/wallet-sdk/lib/keyring";

test.before(async () => {
  await new CKBDebuggerDownloader().downloadIfNotExists();
});

test("Should throw when sign a message without provider", async (t) => {
  await t.throwsAsync(() => signMessage("hello world"));
});

const context = createTestContext(getDefaultConfig());
const managerConfig = { PREFIX: "ckt", SCRIPTS: context.scriptConfigs };

test.serial("Omnilock#Bitcoin P2PKH", async (t) => {
  const { provider } = makeProvider(AddressType.P2PKH);
  const result = await execute(provider);
  t.is(result.code, 0, result.message);
});

test.serial("Omnilock#Bitcoin P2WPKH", async (t) => {
  const { provider } = makeProvider(AddressType.P2WPKH);
  const result = await execute(provider);

  t.is(result.code, 0, result.message);
});

test.serial("Omnilock#Bitcoin P2SH_P2WPKH", async (t) => {
  const { provider } = makeProvider(AddressType.P2SH_P2WPKH);
  const result = await execute(provider);

  t.is(result.code, 0, result.message);
});

async function execute(provider: Provider) {
  const addr = (await provider.requestAccounts())[0];

  const { txSkeleton, lock } = await setupTxSkeleton(addr);

  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const signature = await signMessage(message, "ecdsa", provider);

  txSkeleton.update("witnesses", (witnesses) =>
    witnesses.update(0, () => {
      return bytes.hexify(
        blockchain.WitnessArgs.pack({
          lock: OmnilockWitnessLock.pack({ signature }),
        })
      );
    })
  );

  return await context.executor.execute(txSkeleton, {
    scriptHash: utils.computeScriptHash(lock),
    scriptGroupType: "lock",
  });
}

function makeProvider(addressType: AddressType): {
  provider: Provider;
  pair: core.ECPairInterface;
  keyring: SimpleKeyring;
} {
  const pair = core.ECPair.makeRandom();
  const ring = new keyring.SimpleKeyring([pair.privateKey!.toString("hex")]);
  const publicKey = pair.publicKey.toString("hex");
  const addr = address.publicKeyToAddress(
    publicKey,
    addressType,
    NetworkType.MAINNET
  );

  return {
    pair,
    keyring: ring,
    provider: {
      requestAccounts: async () => [addr],
      signMessage: async (message: string) =>
        ring.signMessage(publicKey, message),
    },
  };
}

async function setupTxSkeleton(addr: string) {
  const txSkeleton = TransactionSkeleton().asMutable();

  const lock = createOmnilockScript(
    { auth: { flag: "BITCOIN", content: addr } },
    { config: managerConfig }
  );

  await common.setupInputCell(
    txSkeleton,
    {
      cellOutput: { capacity: "0x123", lock: lock },
      data: "0x",
      outPoint: mockOutPoint(),
    },
    undefined,
    { config: managerConfig }
  );

  common.prepareSigningEntries(txSkeleton, { config: managerConfig });
  return { txSkeleton: txSkeleton, lock };
}
