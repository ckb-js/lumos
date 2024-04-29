import test from "ava";
import {
  CKBDebuggerDownloader,
  createTestContext,
  getDefaultConfig,
} from "@ckb-lumos/debugger";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { Script, blockchain, utils } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
import { mockOutPoint } from "@ckb-lumos/debugger/lib/context";
import { createOmnilockScript, OmnilockWitnessLock } from "../src/omnilock";
import { Provider, PublicKey, signMessage } from "../src/omnilock-solana";
import { encode } from "bs58";
import nacl from "tweetnacl";
import { common } from "../src";

const context = createTestContext(getDefaultConfig());
const managerConfig = { PREFIX: "ckt", SCRIPTS: context.scriptConfigs };

test.before(async () => {
  await new CKBDebuggerDownloader().downloadIfNotExists();
});

test.serial("Omnilock#Solana", async (t) => {
  const txSkeleton = TransactionSkeleton().asMutable();
  const phantom_solana = makeProvider();
  const { publicKey } = await phantom_solana.connect();

  const solanaAddr = publicKey.toBase58();
  const lock: Script = createOmnilockScript(
    { auth: { flag: "SOLANA", content: solanaAddr } },
    { config: managerConfig }
  );

  await common.setupInputCell(
    txSkeleton,
    {
      cellOutput: { lock, capacity: "0x1" },
      data: "0x",
      outPoint: mockOutPoint(),
    },
    undefined,
    { config: managerConfig }
  );

  common.prepareSigningEntries(txSkeleton, { config: managerConfig });

  const signedMessage = await signMessage(
    txSkeleton.get("signingEntries").get(0)!.message,
    phantom_solana
  );

  const signedWitness = bytes.hexify(
    blockchain.WitnessArgs.pack({
      lock: OmnilockWitnessLock.pack({ signature: signedMessage }),
    })
  );

  txSkeleton.update("witnesses", (witnesses) =>
    witnesses.set(0, signedWitness)
  );

  const result = await context.executor.execute(txSkeleton, {
    scriptHash: utils.computeScriptHash(lock),
    scriptGroupType: "lock",
  });

  t.is(result.code, 0);
});

// make a minimal window.phantom.solana
function makeProvider(): Provider {
  const { secretKey, publicKey } = nacl.sign.keyPair();

  return {
    connect: async () => ({ publicKey: createPublicKey(publicKey) }),

    signMessage: async (message) => ({
      signature: nacl.sign(message, secretKey).subarray(0, -message.length),
      publicKey: createPublicKey(publicKey),
    }),
  };
}

function createPublicKey(publicKey: Uint8Array): PublicKey {
  return {
    toBase58: () => encode(publicKey),
    toBytes: () => publicKey,
  };
}
