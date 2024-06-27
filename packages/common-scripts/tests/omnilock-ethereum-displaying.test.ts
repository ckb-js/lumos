import test from "ava";
import { createOmnilockScript, OmnilockWitnessLock } from "../src/omnilock";
import { Provider, signMessage } from "../src/omnilock-ethereum-displaying";
import { BytesLike, bytes } from "@ckb-lumos/codec";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import {
  CKBDebuggerDownloader,
  createTestContext,
  getDefaultConfig,
} from "@ckb-lumos/debugger";
import common from "../src/common";
import { mockOutPoint } from "@ckb-lumos/debugger/lib/context";
import { blockchain, utils } from "@ckb-lumos/base";
import {
  ecsign,
  fromSigned,
  hashPersonalMessage,
  privateToAddress,
  toUnsigned,
} from "@ethereumjs/util";
import { Uint8 } from "@ckb-lumos/codec/lib/number";
import { randomBytes } from "node:crypto";

const context = createTestContext(getDefaultConfig());
const managerConfig = { PREFIX: "ckt", SCRIPTS: context.scriptConfigs };

test.before(async () => {
  await new CKBDebuggerDownloader().downloadIfNotExists();
});

test("Omnilock with IdentityEthereumDisplayingFlag", async (t) => {
  const privateKey = randomBytes(32);
  const provider = makeProvider(privateKey);

  const lock = createOmnilockScript(
    {
      auth: { flag: "ETHEREUM-DISPLAYING", content: provider.selectedAddress },
    },
    { config: managerConfig }
  );

  const txSkeleton = TransactionSkeleton().asMutable();

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
    provider.selectedAddress,
    txSkeleton.get("signingEntries").get(0)!.message,
    provider
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

function makeProvider(
  privateKey: BytesLike
): Provider & { selectedAddress: string } {
  const privKey = bytes.bytify(privateKey);
  const selectedAddress = bytes.hexify(privateToAddress(privKey));

  return {
    selectedAddress,
    request: async ({ params }) => {
      const message = new TextEncoder().encode(params[1]);
      const msgHash = hashPersonalMessage(message);
      const sig = ecsign(msgHash, privKey);

      const serialized = concatSig(Uint8.pack(sig.v), sig.r, sig.s);
      return serialized;
    },
  };
}

function concatSig(v: Uint8Array, r: Uint8Array, s: Uint8Array): string {
  const rSig = fromSigned(r);
  const sSig = fromSigned(s);

  const rStr = toUnsigned(rSig);
  const sStr = toUnsigned(sSig);

  return bytes.hexify(bytes.concat(rStr, sStr, v));
}
