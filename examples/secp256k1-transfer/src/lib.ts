import { Indexer, helpers, Address, Script, RPC, hd, config, commons, BI, Transaction } from "@ckb-lumos/lumos";
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

export const generateAccountFromPrivateKey = (privKey: string): Account => {
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = AGGRON4.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
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
  const inputs = skeleton.inputs.reduce((acc, cur) => acc.add(cur.cell_output.capacity), BI.from(0));
  const outputs = skeleton.outputs.reduce((acc, cur) => acc.add(cur.cell_output.capacity), BI.from(0));
  return inputs.sub(outputs);
}
/**
 * fetch all cells and calculate the sum of their capacities
 */
export async function fetchAddressBalance(address: string): Promise<BI> {
  let balance = BI.from(0);

  for await (const cell of indexer.collector({ lock: helpers.parseAddress(address, { config: AGGRON4 }) }).collect()) {
    balance = balance.add(cell.cell_output.capacity);
  }

  return balance;
}

interface Options {
  targets: {
    address: string;
    capacity: BIish;
  }[];
  address: string;
}

/**
 * create an unsigned transaction skeleton which includes several inputs and outputs(for multiple transaction receivers)
 */
export async function createUnsignedTxSkeleton(options: Options) {
  let txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer });
  for (const target of options.targets) {
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

  txSkeleton = await payFeeByFeeRate(txSkeleton, [options.address], 1000, undefined, { config: AGGRON4 });
  return txSkeleton;
}

/**
 * sign a transaction skeleton
 * @param txSkeleton unsigned transaction skeleton
 * @param privateKey the private key which can unlock input cells
 * @returns
 */
export function signTransaction(txSkeleton: helpers.TransactionSkeletonType, privateKey: string) {
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const signature = hd.key.signRecoverable(message!, privateKey);
  const tx = helpers.sealTransaction(txSkeleton, [signature]);
  return tx;
}

/**
 * send a transaction to CKB testnet
 * @returns Promise with transaction hash
 */
export async function transfer(tx: Transaction): Promise<string> {
  const hash = await rpc.send_transaction(tx, "passthrough");
  return hash;
}
