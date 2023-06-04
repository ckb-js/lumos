import {
  HexString,
  Address,
  utils,
  Cell,
  TransactionWithStatus,
  Block,
  Script,
} from "@ckb-lumos/base";
import { Indexer } from "@ckb-lumos/ckb-indexer";
import {
  CKBIndexerQueryOptions,
  OtherQueryOptions,
} from "@ckb-lumos/ckb-indexer/lib/type";
import { common, dao } from "@ckb-lumos/common-scripts";
import {
  TransactionSkeleton,
  parseAddress,
  sealTransaction,
  encodeToAddress,
} from "@ckb-lumos/helpers";
import { key } from "@ckb-lumos/hd";
import {
  ScriptConfigs,
  createConfig,
  Config,
  predefined,
  initializeConfig,
} from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import { BI, BIish } from "@ckb-lumos/bi";
import { asyncSleep, randomSecp256k1Account } from "./utils";
import { FaucetQueue } from "./faucetQueue";

type LockScriptLike = Address | Script;
export class E2EProvider {
  readonly pollIntervalMs: number;
  protected indexer: Indexer;
  protected rpc: RPC;
  protected faucetQueue: FaucetQueue;

  constructor(options: {
    indexer: Indexer;
    rpc: RPC;
    pollIntervalMs?: number;
    faucetQueue: FaucetQueue;
  }) {
    const { indexer, rpc, faucetQueue, pollIntervalMs = 1000 } = options;

    this.indexer = indexer;
    this.rpc = rpc;
    this.pollIntervalMs = pollIntervalMs;
    this.faucetQueue = faucetQueue;
  }

  public async getGenesisScriptConfig(): Promise<ScriptConfigs> {
    const genesisBlock = await this.rpc.getBlockByNumber("0x0");

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

  public async loadLocalConfig(): Promise<Config> {
    const _genesisConfig = await this.getGenesisScriptConfig();

    const CONFIG = createConfig({
      PREFIX: "ckt",
      SCRIPTS: {
        ...predefined.AGGRON4.SCRIPTS,
        ..._genesisConfig,
      },
    });

    initializeConfig(CONFIG);
    return CONFIG;
  }

  public async claimCKB(options: {
    claimer: LockScriptLike;
    amount?: BI;
  }): Promise<string> {
    const { claimer, amount = BI.from(1000 * 10 ** 8) } = options;
    const { value: idlePk, onRelease } = await this.faucetQueue.pop();

    try {
      const txHash = await this.transferCKB({
        to: typeof claimer === "string" ? claimer : encodeToAddress(claimer),
        fromPk: idlePk,
        amount,
      });

      await this.waitTransactionCommitted(txHash);
      onRelease();
      return txHash;
    } catch (e) {
      console.error(e);
      onRelease();
      await asyncSleep(3000);
      return this.claimCKB(options);
    }
  }

  // wait for transaction status to be committed
  public async waitTransactionCommitted(
    txHash: string,
    options: {
      timeout?: number;
    } = {}
  ): Promise<TransactionWithStatus> {
    const { timeout = 60 * 1000 } = options;

    let tx = await this.rpc.getTransaction(txHash);
    if (!tx) {
      throw new Error(`not found tx: ${txHash}`);
    }

    let duration = 0;
    while (
      tx.txStatus.status === "pending" ||
      tx.txStatus.status === "proposed"
    ) {
      if (duration > timeout) {
        throw new Error(`wait transaction committed timeout ${txHash}`);
      }
      await asyncSleep(this.pollIntervalMs);
      duration += this.pollIntervalMs;
      tx = await this.rpc.getTransaction(txHash);
    }

    if (tx.txStatus.status !== "committed") {
      throw new Error("transaction status is not committed");
    }

    let rpcTip = Number(await this.rpc.getTipBlockNumber());
    let indexerTip = Number((await this.indexer.tip()).blockNumber);

    while (rpcTip > indexerTip) {
      await asyncSleep(this.pollIntervalMs);
      rpcTip = Number(await this.rpc.getTipBlockNumber());
      indexerTip = Number((await this.indexer.tip()).blockNumber);
    }

    return tx;
  }

  // wait for the block height to greater than or equal to a given value
  public async waitForBlock(options: {
    relative: boolean;
    value: number;
  }): Promise<void> {
    const { relative, value } = options;

    const getCurrentBlock = async () =>
      parseInt(await this.rpc.getTipBlockNumber());

    let currentBlockNumber = await getCurrentBlock();

    const targetBlockNumber = relative ? currentBlockNumber + value : value;

    while (currentBlockNumber < targetBlockNumber) {
      await asyncSleep(this.pollIntervalMs);
      currentBlockNumber = await getCurrentBlock();
    }
  }

  // wait for the epoch to greater than or equal to a given value
  public async waitForEpoch(options: {
    relative: boolean;
    value: number;
  }): Promise<void> {
    const { relative, value } = options;

    const getCurrentepoch = async () =>
      parseInt((await this.rpc.getCurrentEpoch()).number);

    let currentEpochNumber = await getCurrentepoch();

    const targetEpochNumber = relative ? currentEpochNumber + value : value;

    while (currentEpochNumber < targetEpochNumber) {
      await asyncSleep(this.pollIntervalMs);
      currentEpochNumber = await getCurrentepoch();
    }
  }

  public async getBlockByTxHash(txHash: string): Promise<Block> {
    const tx = await this.waitTransactionCommitted(txHash);

    return this.rpc.getBlock(tx.txStatus.blockHash!);
  }

  public async getCapacities(address: Address): Promise<BI> {
    const cells = await this.findCells({ lock: parseAddress(address) });

    return cells.reduce((a, b) => a.add(b.cellOutput.capacity), BI.from(0));
  }

  public async findCells(
    queries: CKBIndexerQueryOptions,
    otherQueryOptions?: OtherQueryOptions
  ): Promise<Cell[]> {
    const cellCollector = this.indexer.collector(queries, otherQueryOptions);

    const cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }

    return cells;
  }

  public async transferCKB(options: {
    to: Address;
    fromPk: HexString;
    amount: BIish;
  }): Promise<string> {
    const from = randomSecp256k1Account(options.fromPk);

    let txSkeleton = TransactionSkeleton({ cellProvider: this.indexer });

    txSkeleton = await common.transfer(
      txSkeleton,
      [from.address],
      options.to,
      options.amount
    );

    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [from.address], 1000);

    txSkeleton = common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = key.signRecoverable(message!, from.privKey);
    const tx = sealTransaction(txSkeleton, [Sig]);

    return this.rpc.sendTransaction(tx, "passthrough");
  }

  public async daoDeposit(options: {
    fromPk: HexString;
    amount?: BIish;
  }): Promise<string> {
    const { fromPk, amount = BI.from(1000 * 10 ** 8) } = options;
    const from = randomSecp256k1Account(fromPk);

    let txSkeleton = TransactionSkeleton({ cellProvider: this.indexer });

    txSkeleton = await dao.deposit(
      txSkeleton,
      from.address,
      from.address,
      amount
    );

    txSkeleton = await common.payFeeByFeeRate(txSkeleton, [from.address], 1000);

    txSkeleton = common.prepareSigningEntries(txSkeleton);
    const message = txSkeleton.get("signingEntries").get(0)?.message;
    const Sig = key.signRecoverable(message!, from.privKey);
    const tx = sealTransaction(txSkeleton, [Sig]);

    return this.rpc.sendTransaction(tx, "passthrough");
  }
}
