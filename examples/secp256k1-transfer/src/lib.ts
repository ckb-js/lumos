import { Indexer, helpers, Address, Script, RPC, hd, config, commons, BI } from "@ckb-lumos/lumos";
import { BIish } from "@ckb-lumos/bi";
import { payFeeByFeeRate } from "@ckb-lumos/common-scripts/lib/common";

const { AGGRON4 } = config.predefined;

const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";
const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);
export const MIN_CELL_CAPACITY = BI.from(61 * 1e8);
export type Account = {
  lockScript: Script;
  address: Address;
  pubKey: string;
};

/**
 * send a transaction to CKB testnet
 * @returns Promise with transaction hash
 */
export async function transfer(options: TransactionIO, privateKey: string): Promise<{ txHash: string; fee: BI }> {
  // step 1, create an raw transaction
  // an raw transaction have it's inputs and outputs, but no signature
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  for (const target of options.targets) {
    // add each outputs to the transaction skeleton
    txSkeleton = await commons.common.transfer(
      txSkeleton,
      [options.address],
      target.address,
      target.capacity,
      options.address,
      undefined,
      { config: AGGRON4 }
    );
  }

  // these methods add transaction fee to transaction.
  // see the calculate algorithm in https://docs.nervos.org/docs/essays/faq/#how-do-you-calculate-transaction-fee
  txSkeleton = await payFeeByFeeRate(txSkeleton, [options.address], 1000, undefined, { config: AGGRON4 });

  // step2: sign an transaction

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);

  // message is the hash of raw transaction
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const signature = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [signature]);

  // step3: send the transaction to block chain
  const txHash = await rpc.sendTransaction(tx, "passthrough");

  // how about transaction fee? it's just sum(transaction.inputs) - sum(transaction.outputs).
  // the transaction fee will be sent to miner.

  const transactionFee = getPaidTransactionFee(txSkeleton);
  return { txHash, fee: transactionFee };
}

export const generateAccountFromPrivateKey = (privKey: string): Account => {
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript: Script = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };
  const address = helpers.encodeToAddress(lockScript, { config: AGGRON4 });
  return {
    lockScript,
    address,
    pubKey,
  };
};

/**
 * calculate the transaction fee by skeleton inputs and outputs
 * @param skeleton unsigned transaction skeleton
 * @returns the transaction fee, it is from `sum(skeleton inputs capacity) - sum(skeleton outputs capacity)`
 */
export function getPaidTransactionFee(skeleton: helpers.TransactionSkeletonType) {
  const inputs = skeleton.inputs.reduce((acc, cur) => acc.add(cur.cellOutput.capacity), BI.from(0));
  const outputs = skeleton.outputs.reduce((acc, cur) => acc.add(cur.cellOutput.capacity), BI.from(0));
  return inputs.sub(outputs);
}

/**
 * fetch all cells and calculate the sum of their capacities
 */
export async function fetchAddressBalance(address: string): Promise<BI> {
  let balance = BI.from(0);

  for await (const cell of indexer.collector({ lock: helpers.parseAddress(address, { config: AGGRON4 }) }).collect()) {
    balance = balance.add(cell.cellOutput.capacity);
  }

  return balance;
}

/**
 * Transaction input and output
 */
interface TransactionIO {
  targets: {
    address: string;
    capacity: BIish;
  }[];
  address: string;
}
