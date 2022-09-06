import { bytes } from '@ckb-lumos/codec';
import { blockchain } from '@ckb-lumos/base'
import { BI, Cell, config, helpers, Indexer, RPC, utils, commons, hd, Hash } from "@ckb-lumos/lumos";

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
  const fromAddress = helpers.encodeToAddress(fromScript, {config: CONFIG});
  const toScript = helpers.parseAddress(options.to);
  const toAddress = helpers.encodeToAddress(toScript, {config: CONFIG});

  txSkeleton = await commons.common.transfer(
    txSkeleton,
    [fromAddress],
    toAddress,
    BigInt(70*10**8),
    undefined,
    undefined,
    {config: CONFIG}
  )
  
  txSkeleton = await commons.common.payFee(txSkeleton,  [fromAddress], 1000, undefined, {config: CONFIG})

  return txSkeleton;
}

export function toMessages(tx: helpers.TransactionSkeletonType) {
  const hasher = new utils.CKBHasher();

  // locks you want to sign
  const signLock = tx.inputs.get(0)?.cellOutput.lock!;

  const messageGroup = commons.createP2PKHMessageGroup(tx, [signLock], {
    hasher: {
      update: (message) => hasher.update(message.buffer),
      digest: () => new Uint8Array(bytes.bytify(hasher.digestHex())),
    },
  });

  return messageGroup[0];
}


export async function signByPrivateKey(txSkeleton: helpers.TransactionSkeletonType, privateKey: string) {
  const messages = toMessages(txSkeleton)

  const signature = hd.key.signRecoverable(messages.message, privateKey);

  const signedWitness = bytes.hexify(blockchain.WitnessArgs.pack({
    lock: commons.omnilock.OmnilockWitnessLock.pack({
      signature: signature,
    }),
  }))

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(0, signedWitness));

  return txSkeleton;
}

export async function sendTransaction(tx: helpers.TransactionSkeletonType): Promise<Hash> {
  const signedTx = helpers.createTransactionFromSkeleton(tx);
  return rpc.sendTransaction(signedTx, 'passthrough');
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
