import { Transaction } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
import { blockchain } from "@ckb-lumos/base";
import { BI, config, helpers, Indexer, RPC, commons, hd, Hash } from "@ckb-lumos/lumos";

export const CONFIG = config.predefined.AGGRON4;
config.initializeConfig(CONFIG);
const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export function asyncSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export interface TransferOptions {
  from: string;
  to: string;
  amount: string;
}

export async function buildTransfer(options: TransferOptions) {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  const fromScript = helpers.parseAddress(options.from);
  const fromAddress = helpers.encodeToAddress(fromScript, { config: CONFIG });
  const toScript = helpers.parseAddress(options.to);
  const toAddress = helpers.encodeToAddress(toScript, { config: CONFIG });
  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [fromAddress],
    toAddress,
    BigInt(70 * 10 ** 8),
    undefined,
    undefined,
    { config: CONFIG }
  );
  txSkeleton = await commons.common.payFee(txSkeleton, [fromAddress], 1000, undefined, { config: CONFIG });
  return txSkeleton;
}

export async function signByPrivateKey(txSkeleton: helpers.TransactionSkeletonType, privateKey: string) {
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const signature = hd.key.signRecoverable(message, privateKey);
  const packedSignature = bytes.hexify(
    commons.omnilock.OmnilockWitnessLock.pack({
      signature: signature,
    })
  );
  const signedTx = helpers.sealTransaction(txSkeleton, [packedSignature]);
  return signedTx;
}

export async function sendTransaction(tx: Transaction): Promise<Hash> {
  return rpc.sendTransaction(tx, "passthrough");
}

export async function capacityOf(address: string): Promise<BI> {
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
  });
  let balance = BI.from(0);
  for await (const cell of collector.collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }
  return balance;
}
