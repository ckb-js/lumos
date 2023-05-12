import { Hash } from "@ckb-lumos/base";
import { BI, parseUnit } from "@ckb-lumos/bi";
import { initializeConfig, predefined } from "@ckb-lumos/config-manager/lib";
import {
  encodeToAddress,
  sealTransaction,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { common } from "@ckb-lumos/common-scripts";
import { key } from "@ckb-lumos/hd";
import { TransactionManager } from "@ckb-lumos/transaction-manager";

const RPC_URL = "https://testnet.ckb.dev";
const CONFIG = predefined.AGGRON4;

initializeConfig(CONFIG);

const SECP256K1_BLAKE160 = CONFIG.SCRIPTS.SECP256K1_BLAKE160!;

const ALICE_PRIVATE_KEY =
  "0x53815fbee34af63e686f5cad7db8074b4b8fd4473617dee2db0ae84d2c6325c4";
// will be used as sender address
const ALICE_ADDRESS = encodeToAddress({
  codeHash: SECP256K1_BLAKE160.CODE_HASH,
  hashType: SECP256K1_BLAKE160.HASH_TYPE,
  args: key.privateKeyToBlake160(ALICE_PRIVATE_KEY),
});
// will be used as recipient address
const BOB_ADDRESS =
  "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwtu4ea6gdaa69znt2hw3snxkenkrsz2aqe6q45t";

const _61Ckb = parseUnit("61", "ckb");

const txManager = new TransactionManager({ providers: { rpcUrl: RPC_URL } });

async function transfer(): Promise<Hash> {
  let txSkeleton = new TransactionSkeleton({ cellProvider: txManager });
  txSkeleton = await common.transfer(
    txSkeleton,
    [ALICE_ADDRESS],
    BOB_ADDRESS,
    BI.from(_61Ckb)
  );
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [ALICE_ADDRESS], 1000);
  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const sig = key.signRecoverable(
    txSkeleton.get("signingEntries").get(0)!.message,
    ALICE_PRIVATE_KEY
  );
  const tx = sealTransaction(txSkeleton, [sig]);
  return txManager.sendTransaction(tx);
}

/**
 * @description This example shows how to use transaction manager to collect cells and send a transaction.
 */
async function main() {
  let current = 0;
  let times = 5;
  while (current++ < times) {
    const txHash = await transfer();
    console.log(`TxHash${current}:`, txHash);
  }
}

main();
