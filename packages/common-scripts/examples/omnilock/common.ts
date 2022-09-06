import { bytes } from "@ckb-lumos/codec";
import {
  TransactionSkeleton,
  encodeToAddress,
  sealTransaction,
} from "@ckb-lumos/helpers";
import { key } from "@ckb-lumos/hd";
import { initializeConfig, predefined } from "@ckb-lumos/config-manager/lib";
import { common, omnilock } from "@ckb-lumos/common-scripts";
import { Script } from "@ckb-lumos/base";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import { RPC } from "@ckb-lumos/rpc";

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

async function main() {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });
  const ckbConfig = predefined.AGGRON4;
  initializeConfig(ckbConfig);
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = key.privateKeyToBlake160(ALICE_PRIVKEY);
  console.log("alice args is:", aliceArgs);

  const aliceOmnilock: Script = omnilock.createOmnilockScript({
    auth: {
      flag: "SECP256K1_BLAKE160",
      content: aliceArgs,
    },
  });
  const aliceSecplock: Script = {
    codeHash: ckbConfig.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
    hashType: ckbConfig.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
    args: aliceArgs,
  };

  console.log("aliceOmnilock is:", aliceOmnilock);
  const aliceOmnilockAddress = encodeToAddress(aliceOmnilock, {
    config: ckbConfig,
  });
  const aliceSecplockAddress = encodeToAddress(aliceSecplock, {
    config: ckbConfig,
  });

  console.log("aliceOmnilockAddress is:", aliceOmnilockAddress);

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

  const sig = key.signRecoverable(message, ALICE_PRIVKEY);
  const omnilockSig = bytes.hexify(
    omnilock.OmnilockWitnessLock.pack({ signature: sig })
  );

  const tx = sealTransaction(txSkeleton, [omnilockSig]);
  const hash = await rpc.sendTransaction(tx, "passthrough");
  console.log("tx is:", tx);
  console.log("The transaction hash is", hash);
  return hash;
}
main();
