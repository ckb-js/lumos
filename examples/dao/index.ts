import { BI, OutPoint, Script, Cell, Address, config, Indexer, RPC, hd, commons, utils } from "@ckb-lumos/lumos";
import { TransactionSkeleton, encodeToAddress, sealTransaction } from "@ckb-lumos/helpers";

// ckt
// const CKB_RPC_URL = "https://testnet.ckb.dev/rpc";
// const CKB_INDEXER_URL = "https://testnet.ckb.dev/indexer";

// dev
const CKB_RPC_URL = 'http://0.0.0.0:8114/rpc';
const CKB_INDEXER_URL = "http://0.0.0.0:8116/indexer";

const rpc = new RPC(CKB_RPC_URL);
const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export const loadDepsFromGenesisBlock = async (): Promise<Record<string, config.ScriptConfig>> => {
  const genesisBlock = await rpc.get_block_by_number("0x0");

  const secp256k1DepTxHash = genesisBlock.transactions[1].hash
  const secp256k1TypeScript = genesisBlock.transactions[0].outputs[1].type
  const secp256k1TypeHash = utils.computeScriptHash(secp256k1TypeScript)

  const daoDepTxHash = genesisBlock.transactions[0].hash
  const daoTypeScript = genesisBlock.transactions[0].outputs[2].type
  const daoTypeHash = utils.computeScriptHash(daoTypeScript)

  return {
    SECP256K1_BLAKE160: {
      HASH_TYPE: 'type',
      CODE_HASH: secp256k1TypeHash,
      TX_HASH: secp256k1DepTxHash,
      INDEX: '0x0',
      DEP_TYPE: 'dep_group',
    },
    DAO: {
      HASH_TYPE: 'type',
      CODE_HASH: daoTypeHash,
      TX_HASH: daoDepTxHash,
      INDEX: '0x2',
      DEP_TYPE: 'code',
    }
  }
}

const loadConfig = async () => {
  const initializeConfig = await loadDepsFromGenesisBlock();

  const CONFIG = config.createConfig({
    PREFIX: "ckt",
    SCRIPTS: {
      ...config.predefined.AGGRON4.SCRIPTS,
      ...initializeConfig,
    },
  });

  config.initializeConfig(CONFIG);
  return CONFIG;
}

type Account = {
  lockScript: Script;
  address: Address;
  pubKey: string;
  privKey: string;
};

export const generateSECP256K1Account = async (privKey: string): Promise<Account> => {
  const CONFIG = await loadConfig();
  
  const pubKey = hd.key.privateToPublic(privKey);
  const args = hd.key.publicKeyToBlake160(pubKey);
  const template = CONFIG.SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: args,
  };
  const address = encodeToAddress(lockScript, { config: CONFIG });
  return {
    lockScript,
    address,
    pubKey,
    privKey,
  };
};

const alicepk = "0xd00c06bfd800d27397002dca6fb0993d5ba6399b4238b2f29ee9deb97593d2bc";

export const getCellByOutPoint = async (outpoint: OutPoint): Promise<Cell> => {
  const tx = await rpc.get_transaction(outpoint.tx_hash);
  const block = await rpc.get_block(tx.tx_status.block_hash);
  return {
    cell_output: tx.transaction.outputs[0], 
    data: tx.transaction.outputs_data[0],
    out_point: outpoint,
    block_hash: tx.tx_status.block_hash,
    block_number: block.header.number,
  }
}

export const deposit = async () => {
  const CONFIG = await loadConfig();
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const alice = await generateSECP256K1Account(alicepk);

  txSkeleton = await commons.dao.deposit(
    txSkeleton,
    alice.address,
    alice.address,
    BI.from(1000*10**8),
    { config: CONFIG },
  );

  txSkeleton = await commons.secp256k1Blake160.payFee(
    txSkeleton,
    alice.address,
    BI.from(1 * 10 ** 8),
    { config: CONFIG },
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, alice.privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  const hash = await rpc.send_transaction(tx, "passthrough");
  return hash;
}

export const withdraw = async (depositOutpoint: OutPoint) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const alice = await generateSECP256K1Account(alicepk);
  const depositCell = await getCellByOutPoint(depositOutpoint);

  txSkeleton = await commons.dao.withdraw(
    txSkeleton,
    depositCell,
    alice.address,
  );

  txSkeleton = await commons.secp256k1Blake160.payFee(
    txSkeleton,
    alice.address,
    BI.from(1 * 10 ** 8),
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, alice.privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  const hash = await rpc.send_transaction(tx, "passthrough");
  return hash;
}

export const unlock = async (
  depositOutpoint: OutPoint,
  withdrawOutpoint: OutPoint,
) => {
  let txSkeleton = TransactionSkeleton({ cellProvider: indexer });

  const alice = await generateSECP256K1Account(alicepk);

  const depositCell = await getCellByOutPoint(depositOutpoint);
  const withdrawCell = await getCellByOutPoint(withdrawOutpoint);

  txSkeleton = await commons.dao.unlock(
    txSkeleton,
    depositCell,
    withdrawCell,
    alice.address,
    alice.address,
  );

  txSkeleton = await commons.secp256k1Blake160.payFee(
    txSkeleton,
    alice.address,
    BI.from(1 * 10 ** 8),
  );

  txSkeleton = commons.common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = hd.key.signRecoverable(message!, alice.privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  const hash = await rpc.send_transaction(tx, "passthrough");
  return hash;
}

// const depositTx = await deposit()
// const depositOutpoint = {tx_hash: depositTx, index: '0x0'}

// const withdrawTx = await withdraw(depositOutpoint)
// const withdrawOutpoint = {tx_hash: withdrawTx, index: '0x0'}

// const unlockTx = await unlock(depositOutpoint, withdrawOutpoint)
