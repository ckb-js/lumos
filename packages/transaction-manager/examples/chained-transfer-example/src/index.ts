import { Cell, Hash, Script } from '@ckb-lumos/base';
import { BI } from '@ckb-lumos/bi';
import { initializeConfig, predefined } from '@ckb-lumos/config-manager/lib';
import { TransactionSkeleton, TransactionSkeletonType, encodeToAddress, sealTransaction } from '@ckb-lumos/helpers';
import { common } from '@ckb-lumos/common-scripts';
import { key } from '@ckb-lumos/hd';
import { TransactionManager } from '@ckb-lumos/transaction-manager';

const ALICE_PRIVATE_KEY = '0x53815fbee34af63e686f5cad7db8074b4b8fd4473617dee2db0ae84d2c6325c4';
const ALICE_ARGS = '0xe9441c447677de3f24fc64ce03f46fd259ed5e8c';
const RPC_URL = 'https://testnet.ckb.dev';
const _61_CKB_SHANNON = 6_100_000_000;
const CONFIG = predefined.AGGRON4;
initializeConfig(CONFIG);
const bobAddress = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqwtu4ea6gdaa69znt2hw3snxkenkrsz2aqe6q45t"

const SECP256K1_BLAKE160 = CONFIG.SCRIPTS.SECP256K1_BLAKE160!;
const aliceLock: Script = {
  codeHash: SECP256K1_BLAKE160.CODE_HASH,
  hashType: SECP256K1_BLAKE160.HASH_TYPE,
  args: ALICE_ARGS,
};
const aliceAddress = encodeToAddress(aliceLock);
const txManager = new TransactionManager({
  providers: {
    rpcUrl: RPC_URL,
  },
});

/**
 * @description This example shows how to use transaction manager to collect cells and send a transaction.
 */
async function main() {
  await checkBalanceEnough();

  const txHash1 = await transferViaTxManager();
  console.log('txHash1:', txHash1);
  const txHash2 = await transferViaTxManager();
  console.log('txHash2:', txHash2);
}

main();


async function transferViaTxManager(): Promise<Hash> {
  let txSkeleton = await transfer100CkbToBob();
  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const sig = key.signRecoverable(txSkeleton.get('signingEntries').get(0)!.message, ALICE_PRIVATE_KEY);
  const tx = sealTransaction(txSkeleton, [sig]);
  return await txManager.sendTransaction(tx);
}

async function transfer100CkbToBob(): Promise<TransactionSkeletonType> {
  let txSkeleton = new TransactionSkeleton({ cellProvider: txManager });
  txSkeleton = await common.transfer(txSkeleton, [aliceAddress], bobAddress,  BI.from(_61_CKB_SHANNON));
  txSkeleton = await common.payFee(txSkeleton, [aliceAddress], 100_000);
  return txSkeleton;
}

async function checkBalanceEnough(): Promise<Cell[]> {
  const cellCollector = await txManager.collector({ lock: aliceLock });
  cellCollector.collect();
  const cells: Cell[] = [];
  let collectedCapacity = BI.from(0);
  for await (const cell of cellCollector.collect()) {
    if (collectedCapacity.gte(BI.from(_61_CKB_SHANNON))) break;
    if (!!cell.cellOutput.type || (!!cell.data && cell.data !== '0x')) continue;
    cells.push(cell);
    collectedCapacity = collectedCapacity.add(cell.cellOutput.capacity);
  }
  if (collectedCapacity.lt(BI.from(_61_CKB_SHANNON))) {
    throw new Error('Not enough capacity, address is ' + aliceAddress + ', go to https://faucet.nervos.org/');
  }
  return cells;
}
