import {
  HexString,
  Address,
  utils,
  Cell,
  Script,
  TransactionWithStatus,
  Block,
} from "@ckb-lumos/base";
import { Indexer, CellCollector } from "@ckb-lumos/ckb-indexer";
import {
  CKBIndexerQueryOptions,
  OtherQueryOptions,
} from "@ckb-lumos/ckb-indexer/lib/type";
import { common, dao } from "@ckb-lumos/common-scripts";
import {
  TransactionSkeleton,
  encodeToAddress,
  parseAddress,
  sealTransaction,
} from "@ckb-lumos/helpers";
import { key, mnemonic, ExtendedPrivateKey, AddressType } from "@ckb-lumos/hd";
import {
  getConfig,
  ScriptConfigs,
  initializeConfig,
  predefined,
  createConfig,
  Config,
} from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import { BI } from "@ckb-lumos/bi";
import { INDEXER_RPC_URI, CKB_RPC_URI } from "./constants";

export const defaultIndexer = new Indexer(INDEXER_RPC_URI, CKB_RPC_URI);
export const defaultRPC = new RPC(CKB_RPC_URI);

export async function getGenesisSciprtConfig(
  options: { rpc?: RPC } = {}
): Promise<ScriptConfigs> {
  const { rpc: _rpc = defaultRPC } = options;
  const genesisBlock = await _rpc.getBlockByNumber("0x0");

  const secp256k1DepTxHash = genesisBlock.transactions[1].hash;
  const secp256k1TypeScript = genesisBlock.transactions[0].outputs[1].type;
  const secp256k1TypeHash = utils.computeScriptHash(secp256k1TypeScript!);

  const daoDepTxHash = genesisBlock.transactions[0].hash;
  const daoTypeScript = genesisBlock.transactions[0].outputs[2].type;
  const daoTypeHash = utils.computeScriptHash(daoTypeScript!);

  return {
    SECP256K1_BLAKE160: {
      HASH_TYPE: "type",
      CODE_HASH: secp256k1TypeHash,
      TX_HASH: secp256k1DepTxHash!,
      INDEX: "0x0",
      DEP_TYPE: "depGroup",
    },
    DAO: {
      HASH_TYPE: "type",
      CODE_HASH: daoTypeHash,
      TX_HASH: daoDepTxHash!,
      INDEX: "0x2",
      DEP_TYPE: "code",
    },
  };
}

export const loadConfig = async (): Promise<Config> => {
  const _genesisConfig = await getGenesisSciprtConfig();

  const CONFIG = createConfig({
    PREFIX: "ckt",
    SCRIPTS: {
      ...predefined.AGGRON4.SCRIPTS,
      ..._genesisConfig,
    },
  });

  initializeConfig(CONFIG);
  return CONFIG;
};

export const generateFirstHDPrivateKey = (): string => {
  const myMnemonic = mnemonic.generateMnemonic();
  const seed = mnemonic.mnemonicToSeedSync(myMnemonic);

  const extendedPrivKey = ExtendedPrivateKey.fromSeed(seed);
  return extendedPrivKey.privateKeyInfo(AddressType.Receiving, 0).privateKey;
};

export function asyncSleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitTransactionCommitted(
  txHash: string,
  options: {
    rpc?: RPC;
    pollIntervalMs?: number;
    indexer?: Indexer;
  } = {}
): Promise<TransactionWithStatus> {
  const {
    rpc: _rpc = defaultRPC,
    indexer: _indexer = defaultIndexer,
    pollIntervalMs = 1000,
  } = options;

  let tx = await _rpc.getTransaction(txHash);
  if (!tx) {
    throw new Error(`not found tx: ${txHash}`);
  }

  while (tx.txStatus.status !== "committed") {
    await asyncSleep(pollIntervalMs);
    tx = await _rpc.getTransaction(txHash);
  }

  let rpcTip = Number(await _rpc.getTipBlockNumber());
  let indexerTip = Number((await _indexer.tip()).blockNumber);

  while (rpcTip > indexerTip) {
    await asyncSleep(pollIntervalMs);
    rpcTip = Number(await _rpc.getTipBlockNumber());
    indexerTip = Number((await _indexer.tip()).blockNumber);
  }

  return tx;
}

export async function waitBlockByNumber(
  blockNumber: number,
  options: {
    rpc?: RPC;
    log?: boolean;
  } = {}
): Promise<void> {
  const { rpc: _rpc = defaultRPC, log = false } = options;

  const getCurrentBlock = async () => parseInt(await _rpc.getTipBlockNumber());

  let currentBlockNumber = await getCurrentBlock();

  while (currentBlockNumber < blockNumber) {
    await asyncSleep(5 * 1000);
    currentBlockNumber = await getCurrentBlock();
    if (log) {
      console.log(
        "wait ",
        blockNumber,
        " block, current is ",
        currentBlockNumber
      );
    }
  }
}

export async function waitEpochByNumber(options: {
  epochNumber: number;
  rpc?: RPC;
  log?: boolean;
}): Promise<void> {
  const { epochNumber, rpc: _rpc = defaultRPC, log = false } = options;

  const getCurrentepoch = async () =>
    parseInt((await _rpc.getCurrentEpoch()).number);

  let currentEpoch = await getCurrentepoch();

  while (currentEpoch < epochNumber) {
    await asyncSleep(5 * 1000);
    currentEpoch = await getCurrentepoch();
    if (log) {
      console.log("wait ", epochNumber, " epoch, current is ", currentEpoch);
    }
  }
}

export async function getBlockByTxHash(
  txHash: string,
  options: {
    rpc?: RPC;
  } = {}
): Promise<Block> {
  const { rpc: _rpc = defaultRPC } = options;
  const tx = await waitTransactionCommitted(txHash, { rpc: _rpc });

  return _rpc.getBlock(tx.txStatus.blockHash!);
}

export interface HDAccount {
  lockScript: Script;
  address: string;
  pubKey: string;
  privKey: string;
}

export const generateHDAccount = (privKey?: string): HDAccount => {
  const _privKey = (() => {
    if (privKey) {
      return privKey;
    }

    return generateFirstHDPrivateKey();
  })();

  const pubKey = key.privateToPublic(_privKey);
  const args = key.publicKeyToBlake160(pubKey);
  const template = getConfig().SCRIPTS["SECP256K1_BLAKE160"]!;
  const lockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: args,
  };

  const address = encodeToAddress(lockScript);

  return {
    lockScript,
    address,
    pubKey,
    privKey: _privKey,
  };
};

export async function getCapacities(
  indexer: Indexer,
  address: Address
): Promise<number> {
  const cells = await findCells(indexer, { lock: parseAddress(address) });

  return cells
    .reduce((a, b) => a.add(b.cellOutput.capacity), BI.from(0))
    .toNumber();
}

export async function findCells(
  indexer: Indexer,
  queries: CKBIndexerQueryOptions,
  otherQueryOptions?: OtherQueryOptions
): Promise<Cell[]> {
  const cellCollector = new CellCollector(indexer, queries, otherQueryOptions);

  const cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  return cells;
}

export async function transferCKB(options: {
  to: Address;
  fromPk: HexString;
  amount: number;
  rpc?: RPC;
  indexer?: Indexer;
}): Promise<string> {
  const { rpc: _rpc = defaultRPC, indexer: _indexer = defaultIndexer } =
    options;
  const from = generateHDAccount(options.fromPk);

  let txSkeleton = TransactionSkeleton({ cellProvider: _indexer });

  txSkeleton = await common.transfer(
    txSkeleton,
    [from.address],
    options.to,
    BigInt(options.amount * 10 ** 8)
  );

  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [from.address], 1000);

  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = key.signRecoverable(message!, from.privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  return _rpc.sendTransaction(tx, "passthrough");
}

export async function daoDeposit(options: {
  fromPk: HexString;
  amount?: number;
  rpc?: RPC;
  indexer?: Indexer;
}): Promise<string> {
  const {
    fromPk,
    amount = 1000,
    rpc: _rpc = defaultRPC,
    indexer: _indexer = defaultIndexer,
  } = options;
  const from = generateHDAccount(fromPk);

  let txSkeleton = TransactionSkeleton({ cellProvider: _indexer });

  txSkeleton = await dao.deposit(
    txSkeleton,
    from.address,
    from.address,
    BigInt(amount * 10 ** 8)
  );

  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [from.address], 1000);

  txSkeleton = common.prepareSigningEntries(txSkeleton);
  const message = txSkeleton.get("signingEntries").get(0)?.message;
  const Sig = key.signRecoverable(message!, from.privKey);
  const tx = sealTransaction(txSkeleton, [Sig]);

  return _rpc.sendTransaction(tx, "passthrough");
}
