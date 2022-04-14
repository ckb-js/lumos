import {
  HexString,
  Script,
  Cell,
  OutPoint,
  QueryOptions,
  Transaction,
  Output,
  CellCollector as CellCollectorInterface,
  helpers,
  utils,
  Indexer,
  TransactionWithStatus,
  TransactionCollector as BaseTransactionCollector,
} from "@ckb-lumos/base";
import { Map, Set } from "immutable";
import { Config, getConfig } from "@ckb-lumos/config-manager";
import { RPC } from "@ckb-lumos/rpc";
import {
  AccountExtendedPublicKey,
  AddressType,
  ExtendedPrivateKey,
  key,
  Keystore,
  mnemonic,
} from "@ckb-lumos/hd";
import { assertPublicKey, assertChainCode } from "@ckb-lumos/hd/lib/helper";
import { BI } from "@ckb-lumos/bi";
const { isCellMatchQueryOptions } = helpers;
const { publicKeyToBlake160 } = key;
const { mnemonicToSeedSync } = mnemonic;

export function serializeOutPoint(outPoint: OutPoint): string {
  return `${outPoint.tx_hash}_${outPoint.index}`;
}

function assertsNonNil<T>(
  value: T,
  name: string
): asserts value is NonNullable<T> {
  if (value === undefined || value === null)
    throw new Error("Impossible: can not find " + name);
}

export interface PublicKeyInfo {
  publicKey: HexString;
  path: string;
  index: number;
  blake160: HexString;
  historyTxCount: number;
}

interface LockScriptInfo {
  lockScript: Script;
  publicKeyInfo: PublicKeyInfo;
}

export interface LockScriptMappingInfo {
  code_hash: HexString;
  hash_type: "data" | "type";
  publicKeyToArgs: (publicKey: HexString) => HexString;
}

export class HDCache {
  private masterPublicKeyInfo?: PublicKeyInfo;
  private publicKey: HexString;
  private chainCode: HexString;
  private accountExtendedPublicKey: AccountExtendedPublicKey;

  public readonly receivingKeys: PublicKeyInfo[];
  public readonly changeKeys: PublicKeyInfo[];

  private lockScriptInfos: LockScriptInfo[];
  private infos: LockScriptMappingInfo[];

  static receivingKeyThreshold = 20;
  static changeKeyThreshold = 10;

  static receivingKeyInitCount = 30;
  static changeKeyInitCount = 20;

  constructor(
    publicKey: HexString,
    chainCode: HexString,
    infos: LockScriptMappingInfo[] = [],
    masterPublicKey?: HexString
  ) {
    if (masterPublicKey) {
      this.masterPublicKeyInfo = {
        publicKey: masterPublicKey,
        blake160: publicKeyToBlake160(masterPublicKey),
        path: AccountExtendedPublicKey.ckbAccountPath,
        index: -1,
        historyTxCount: 0,
      };
    }
    this.publicKey = publicKey;
    this.chainCode = chainCode;
    this.receivingKeys = [];
    this.changeKeys = [];
    this.accountExtendedPublicKey = new AccountExtendedPublicKey(
      this.publicKey,
      this.chainCode
    );
    this.init();

    this.infos = infos;
    this.lockScriptInfos = [];
    this.resetLockScripts();
  }

  getMasterPublicKeyInfo(): PublicKeyInfo | undefined {
    return this.masterPublicKeyInfo;
  }

  updateMasterPublicKeyHistoryTxCount(count: number): void {
    if (this.masterPublicKeyInfo) {
      this.masterPublicKeyInfo.historyTxCount = count;
    }
  }

  getLockScriptInfos(): LockScriptInfo[] {
    return this.lockScriptInfos;
  }

  resetLockScripts(): void {
    this.lockScriptInfos = this.getKeys()
      .map((publicKeyInfo) => {
        return this.infos.map((info) => {
          return {
            lockScript: {
              code_hash: info.code_hash,
              hash_type: info.hash_type,
              args: info.publicKeyToArgs(publicKeyInfo.publicKey),
            },
            publicKeyInfo,
          };
        });
      })
      .flat();
  }

  getKeys(): PublicKeyInfo[] {
    let keys = this.receivingKeys.concat(this.changeKeys);
    if (this.masterPublicKeyInfo) {
      keys = keys.concat([this.masterPublicKeyInfo]);
    }
    return keys;
  }

  private init(): void {
    this.deriveReceivingKeys(HDCache.receivingKeyInitCount);
    this.deriveChangeKeys(HDCache.changeKeyInitCount);
  }

  deriveKeys(): void {
    this.checkAndDeriveReceivingKeys();
    this.checkAndDeriveChangeKeys();

    // auto update LockScriptMappingInfos
    this.resetLockScripts();
  }

  private checkAndDeriveReceivingKeys(): void {
    const lastIndex: number = this.receivingKeys.length - 1;
    const usedKeys = this.receivingKeys.filter(
      (key) => key.historyTxCount !== 0
    );
    const lastUsedIndex: number =
      usedKeys.length === 0 ? -1 : usedKeys[usedKeys.length - 1].index;

    const unusedKeyCount: number = lastIndex - lastUsedIndex;
    if (unusedKeyCount < HDCache.receivingKeyThreshold) {
      this.deriveReceivingKeys(HDCache.receivingKeyThreshold);
    }
  }

  private deriveReceivingKeys(count: number): void {
    if (count <= 0) {
      return;
    }
    const lastIndex: number = this.receivingKeys.length - 1;
    for (let i = lastIndex + 1; i <= lastIndex + count; ++i) {
      this.receivingKeys.push(
        this.generatePublicKeyInfo(AddressType.Receiving, i)
      );
    }
  }

  private checkAndDeriveChangeKeys(): void {
    const lastIndex: number = this.changeKeys[this.changeKeys.length - 1].index;
    const usedKeys = this.changeKeys.filter((key) => key.historyTxCount !== 0);
    const lastUsedIndex: number =
      usedKeys.length === 0 ? -1 : usedKeys[usedKeys.length - 1].index;

    const unusedKeyCount: number = lastIndex - lastUsedIndex;
    if (unusedKeyCount < HDCache.changeKeyThreshold) {
      this.deriveChangeKeys(HDCache.changeKeyThreshold);
    }
  }

  private deriveChangeKeys(count: number): void {
    if (count <= 0) {
      return;
    }
    const lastIndex: number = this.changeKeys.length - 1;
    for (let i = lastIndex + 1; i <= lastIndex + count; ++i) {
      this.changeKeys.push(this.generatePublicKeyInfo(AddressType.Change, i));
    }
  }

  getNextReceivingPublicKeyInfo(): PublicKeyInfo {
    const info: PublicKeyInfo | undefined = this.receivingKeys.find(
      (key) => key.historyTxCount === 0
    );
    assertsNonNil(info, "next receiving public key");
    return info;
  }

  getNextChangePublicKeyInfo(): PublicKeyInfo {
    const info: PublicKeyInfo | undefined = this.changeKeys.find(
      (key) => key.historyTxCount === 0
    );
    assertsNonNil(info, "next change public key");
    return info;
  }

  private generatePublicKeyInfo(
    type: AddressType,
    index: number
  ): PublicKeyInfo {
    const publicKeyInfo = this.accountExtendedPublicKey.publicKeyInfo(
      type,
      index
    );
    return {
      publicKey: publicKeyInfo.publicKey,
      blake160: publicKeyInfo.blake160,
      path: publicKeyInfo.path,
      index,
      historyTxCount: 0,
    };
  }
}

function outputToCell(
  output: Output,
  data: HexString,
  txHash: HexString,
  index: HexString,
  blockHash: HexString,
  blockNumber: HexString
): Cell {
  return {
    cell_output: {
      capacity: output.capacity,
      lock: output.lock,
      type: output.type,
    },
    out_point: {
      tx_hash: txHash,
      index,
    },
    data: data,
    block_hash: blockHash,
    block_number: blockNumber,
  };
}

function lockScriptMatch(script: Script, otherScript: Script): boolean {
  const shorterArgsLength = Math.min(
    script.args.length,
    otherScript.args.length
  );
  return (
    script.code_hash === otherScript.code_hash &&
    script.hash_type === otherScript.hash_type &&
    script.args.slice(0, shorterArgsLength) ===
      otherScript.args.slice(0, shorterArgsLength)
  );
}

export class TransactionCache {
  // key: public key
  // value: transaction hash set
  private totalTransactionCountCache: Map<HexString, Set<HexString>>;
  private liveCellCache: Map<string, Cell>;
  private hdCache: HDCache;

  constructor(hdCache: HDCache) {
    this.liveCellCache = Map<string, Cell>();
    this.totalTransactionCountCache = Map();
    this.hdCache = hdCache;
  }

  getLiveCellCache(): Map<string, Cell> {
    return this.liveCellCache;
  }

  addTransactionCountCache(key: HexString, value: HexString): void {
    const previous = this.totalTransactionCountCache.get(key);
    const set = previous || Set<HexString>();
    this.totalTransactionCountCache = this.totalTransactionCountCache.set(
      key,
      set.add(value)
    );

    const count: number | undefined = this.totalTransactionCountCache.get(key)
      ?.size;
    /* c8 ignore next 3 */
    if (count === undefined) {
      throw new Error(
        "Impossible: transaction count cache of key is undefined"
      );
    }
    const receivingIndex: number = this.hdCache.receivingKeys.findIndex(
      (k) => k.publicKey === key
    );
    if (receivingIndex >= 0) {
      this.hdCache.receivingKeys[receivingIndex].historyTxCount = count;
    } else {
      const changeIndex: number = this.hdCache.changeKeys.findIndex(
        (k) => k.publicKey === key
      );
      if (changeIndex >= 0) {
        this.hdCache.changeKeys[changeIndex].historyTxCount = count;
      } else {
        const masterPublicKeyInfo = this.hdCache.getMasterPublicKeyInfo();
        if (masterPublicKeyInfo && masterPublicKeyInfo.publicKey === key) {
          this.hdCache.updateMasterPublicKeyHistoryTxCount(count);
        }
      }
    }
  }

  parseTransaction(
    transaction: Transaction,
    lockScript: Script,
    publicKey: HexString,
    blockHash: HexString,
    blockNumber: HexString
  ): void {
    const txHash: HexString | undefined = transaction?.hash;
    assertsNonNil(txHash, "transaction.hash");
    const outputs: Cell[] = transaction.outputs
      .map((output, index) => {
        if (!lockScriptMatch(output.lock, lockScript)) {
          return;
        }

        const outputIndex: HexString = "0x" + index.toString(16);

        const cell: Cell = outputToCell(
          output,
          transaction.outputs_data[index],
          txHash,
          outputIndex,
          blockHash,
          blockNumber
        );

        return cell;
      })
      .filter((output) => !!output) as Cell[];

    const inputOutPoints = transaction.inputs.map((input) => {
      return input.previous_output;
    });

    this.addTransactionCountCache(publicKey, txHash);

    outputs.forEach((output) => {
      assertsNonNil(output.out_point, "output.out_point");
      const key = serializeOutPoint(output.out_point);
      this.liveCellCache = this.liveCellCache.set(key, output);
    });
    inputOutPoints.forEach((inputOutPoint) => {
      const key = serializeOutPoint(inputOutPoint);
      this.liveCellCache = this.liveCellCache.delete(key);
    });
  }
}

export class Cache {
  public readonly hdCache: HDCache;
  public readonly txCache: TransactionCache;
  private indexer: Indexer;

  private lastTipBlockNumber: BI = BI.from(0);
  private TransactionCollector: typeof BaseTransactionCollector;

  private rpc: RPC;

  constructor(
    indexer: Indexer,
    publicKey: HexString,
    chainCode: HexString,
    infos: LockScriptMappingInfo[],
    {
      TransactionCollector,
      masterPublicKey = undefined,
      rpc = new RPC(indexer.uri),
    }: {
      TransactionCollector: typeof BaseTransactionCollector;
      masterPublicKey?: HexString;
      rpc?: RPC;
    }
  ) {
    this.indexer = indexer;
    this.hdCache = new HDCache(publicKey, chainCode, infos, masterPublicKey);
    this.txCache = new TransactionCache(this.hdCache);

    this.TransactionCollector = TransactionCollector;

    this.rpc = rpc;
  }

  getLastTipBlockNumber(): HexString {
    return "0x" + this.lastTipBlockNumber.toString(16);
  }

  async tip(): Promise<HexString> {
    const t = await this.indexer.tip();
    return t.block_number;
  }

  private async innerLoopTransactions(fromBlock: BI, toBlock: BI) {
    for (const lockScriptInfo of this.hdCache.getLockScriptInfos()) {
      const lockScript: Script = lockScriptInfo.lockScript;
      const transactionCollector = new this.TransactionCollector(
        this.indexer,
        {
          lock: lockScript,
          fromBlock: "0x" + fromBlock.toString(16),
          toBlock: "0x" + toBlock.toString(16),
          argsLen: "any",
        },
        {
          includeStatus: true,
        }
      );
      for await (const txWithStatus of transactionCollector.collect()) {
        const txWS = txWithStatus as TransactionWithStatus;
        const tx = txWS.transaction;
        const blockHash: HexString | undefined = txWS.tx_status.block_hash;
        assertsNonNil(blockHash, "block hash");
        const tipHeader = await this.rpc.get_header(blockHash);
        const blockNumber: HexString | undefined = tipHeader?.number;
        assertsNonNil(blockNumber, "tipHeader.number");

        this.txCache.parseTransaction(
          tx,
          lockScript,
          lockScriptInfo.publicKeyInfo.publicKey,
          blockHash,
          blockNumber
        );
        this.hdCache.deriveKeys();
      }
    }
  }

  private async loopTransactions(tipBlockNumber: HexString) {
    const tip: BI = BI.from(tipBlockNumber);
    if (tip.lte(this.lastTipBlockNumber)) {
      return;
    }

    await this.innerLoopTransactions(this.lastTipBlockNumber.add(1), tip);
    this.lastTipBlockNumber = tip;
  }

  async loop(): Promise<void> {
    const tipBlockNumber: HexString = (await this.indexer.tip()).block_number;
    await this.loopTransactions(tipBlockNumber);
  }
}

// export for tests
export function publicKeyToMultisigArgs(publicKey: HexString): HexString {
  const blake160: HexString = publicKeyToBlake160(publicKey);

  const R = 0;
  const M = 1;
  const publicKeyHashes = [blake160];

  const serialized =
    "0x00" +
    ("00" + R.toString(16)).slice(-2) +
    ("00" + M.toString(16)).slice(-2) +
    ("00" + publicKeyHashes.length.toString(16)).slice(-2) +
    publicKeyHashes.map((h) => h.slice(2)).join("");

  const args = new utils.CKBHasher()
    .update(serialized)
    .digestHex()
    .slice(0, 42);
  return args;
}

export function getDefaultInfos(
  config: Config | undefined = undefined
): LockScriptMappingInfo[] {
  config = config || getConfig();
  const infos: LockScriptMappingInfo[] = [];
  const secpTemplate = config.SCRIPTS.SECP256K1_BLAKE160;
  if (secpTemplate) {
    infos.push({
      code_hash: secpTemplate.CODE_HASH,
      hash_type: secpTemplate.HASH_TYPE,
      publicKeyToArgs: publicKeyToBlake160,
    });
  }
  const multisigTemplate = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  if (multisigTemplate) {
    infos.push({
      code_hash: multisigTemplate.CODE_HASH,
      hash_type: multisigTemplate.HASH_TYPE,
      publicKeyToArgs: publicKeyToMultisigArgs,
    });
  }
  const anyoneCanPayTemplate = config.SCRIPTS.ANYONE_CAN_PAY;
  if (anyoneCanPayTemplate) {
    infos.push({
      code_hash: anyoneCanPayTemplate.CODE_HASH,
      hash_type: anyoneCanPayTemplate.HASH_TYPE,
      publicKeyToArgs: publicKeyToBlake160,
    });
  }

  return infos;
}

function defaultLogger(level: string, message: string): void {
  console.log(`[${level}] ${message}`);
}

// Cache manager
export class CacheManager {
  private cache: Cache;
  private logger: (level: string, message: string) => void;
  private isRunning: boolean;
  private livenessCheckIntervalSeconds: number;
  private pollIntervalSeconds: number;

  constructor(
    indexer: Indexer,
    publicKey: HexString,
    chainCode: HexString,
    infos: LockScriptMappingInfo[] = getDefaultInfos(),
    {
      TransactionCollector,
      logger = defaultLogger,
      pollIntervalSeconds = 2,
      livenessCheckIntervalSeconds = 5,
      rpc = new RPC(indexer.uri),
    }: {
      TransactionCollector: typeof BaseTransactionCollector;
      logger?: (level: string, message: string) => void;
      pollIntervalSeconds?: number;
      livenessCheckIntervalSeconds?: number;
      rpc?: RPC;
    },
    masterPublicKey?: HexString
  ) {
    assertPublicKey(publicKey);
    assertChainCode(chainCode);
    if (masterPublicKey) {
      assertPublicKey(masterPublicKey, "masterPublicKey");
    }
    this.logger = logger;
    this.cache = new Cache(indexer, publicKey, chainCode, infos, {
      TransactionCollector,
      masterPublicKey,
      rpc,
    });
    this.isRunning = false;
    this.pollIntervalSeconds = pollIntervalSeconds;
    this.livenessCheckIntervalSeconds = livenessCheckIntervalSeconds;
  }

  /**
   * Load from keystore, if needMasterPublicKey set to true or origin = "ckb-cli",
   * will enable masterPublicKey
   *
   * @param indexer
   * @param path
   * @param password
   * @param infos
   * @param options
   */
  static loadFromKeystore(
    indexer: Indexer,
    path: string,
    password: string,
    infos: LockScriptMappingInfo[] = getDefaultInfos(),
    options: {
      logger?: (level: string, message: string) => void;
      pollIntervalSeconds?: number;
      livenessCheckIntervalSeconds?: number;
      TransactionCollector: typeof BaseTransactionCollector;
      needMasterPublicKey?: boolean;
      rpc?: RPC;
    }
  ): CacheManager {
    const keystore = Keystore.load(path);
    const extendedPrivateKey = keystore.extendedPrivateKey(password);
    const accountExtendedPublicKey = extendedPrivateKey.toAccountExtendedPublicKey();

    let masterPublicKey: HexString | undefined;
    if (options.needMasterPublicKey || keystore.isFromCkbCli()) {
      const extendedPublicKey = extendedPrivateKey.toExtendedPublicKey();
      masterPublicKey = extendedPublicKey.publicKey;
    }

    return new CacheManager(
      indexer,
      accountExtendedPublicKey.publicKey,
      accountExtendedPublicKey.chainCode,
      infos,
      options,
      masterPublicKey
    );
  }

  static fromMnemonic(
    indexer: Indexer,
    mnemonic: string,
    infos: LockScriptMappingInfo[] = getDefaultInfos(),
    options: {
      logger?: (level: string, message: string) => void;
      pollIntervalSeconds?: number;
      livenessCheckIntervalSeconds?: number;
      TransactionCollector: typeof BaseTransactionCollector;
      needMasterPublicKey?: boolean;
      rpc?: RPC;
    }
  ): CacheManager {
    const seed = mnemonicToSeedSync(mnemonic);
    const extendedPrivateKey = ExtendedPrivateKey.fromSeed(seed);
    const accountExtendedPublicKey = extendedPrivateKey.toAccountExtendedPublicKey();

    let masterPublicKey: HexString | undefined;
    if (options.needMasterPublicKey) {
      const extendedPublicKey = extendedPrivateKey.toExtendedPublicKey();
      masterPublicKey = extendedPublicKey.publicKey;
    }

    return new CacheManager(
      indexer,
      accountExtendedPublicKey.publicKey,
      accountExtendedPublicKey.chainCode,
      infos,
      options,
      masterPublicKey
    );
  }

  running(): boolean {
    return this.isRunning;
  }

  scheduleLoop(): void {
    setTimeout(() => {
      this.loop();
    }, this.pollIntervalSeconds * 1000);
  }

  stop(): void {
    this.isRunning = false;
  }

  async loop(): Promise<void> {
    if (!this.running()) {
      return;
    }
    this.cache
      .loop()
      .then(() => {
        this.scheduleLoop();
      })
      .catch((e) => {
        this.logger(
          "error",
          `Error occurs: ${e} ${e.stack}, stopping indexer!`
        );
        this.stop();
      });
  }

  start(): void {
    this.isRunning = true;
    this.scheduleLoop();
  }

  startForever(): void {
    this.start();
    setInterval(() => {
      if (!this.running()) {
        this.logger("error", "Error occurs, maybe check the log?");
        this.start();
      }
    }, this.livenessCheckIntervalSeconds * 1000);
  }

  getLiveCellsCache(): Map<string, Cell> {
    return this.cache.txCache.getLiveCellCache();
  }

  getMasterPublicKeyInfo(): PublicKeyInfo | undefined {
    return this.cache.hdCache.getMasterPublicKeyInfo();
  }

  getNextReceivingPublicKeyInfo(): PublicKeyInfo {
    return this.cache.hdCache.getNextReceivingPublicKeyInfo();
  }

  getNextChangePublicKeyInfo(): PublicKeyInfo {
    return this.cache.hdCache.getNextChangePublicKeyInfo();
  }

  getReceivingKeys(): PublicKeyInfo[] {
    return this.cache.hdCache.receivingKeys;
  }

  getChangeKeys(): PublicKeyInfo[] {
    return this.cache.hdCache.changeKeys;
  }
}

export class CellCollector implements CellCollectorInterface {
  private cacheManager: CacheManager;

  constructor(cacheManger: CacheManager) {
    this.cacheManager = cacheManger;
  }

  async *collect(): AsyncGenerator<Cell> {
    for (const cell of this.cacheManager.getLiveCellsCache().values()) {
      yield cell;
    }
  }
}

export class CellCollectorWithQueryOptions implements CellCollectorInterface {
  private collector: CellCollector;
  private queryOptions: QueryOptions;

  constructor(
    collector: CellCollector,
    {
      lock = undefined,
      type = undefined,
      argsLen = -1,
      data = "any",
      fromBlock = undefined,
      toBlock = undefined,
      skip = undefined,
    }: QueryOptions = {}
  ) {
    this.collector = collector;
    this.queryOptions = {
      lock,
      type,
      argsLen,
      data,
      fromBlock,
      toBlock,
      skip,
    };
  }

  async *collect(): AsyncGenerator<Cell> {
    const skip = this.queryOptions.skip;
    let skipCount = 0;
    for await (const cell of this.collector.collect()) {
      if (isCellMatchQueryOptions(cell, this.queryOptions)) {
        if (skip && skipCount < skip) {
          skipCount += 1;
        } else {
          yield cell;
        }
      }
    }
  }
}

export async function getBalance(
  cellCollector: CellCollectorInterface
): Promise<HexString> {
  let balance: BI = BI.from(0);
  for await (const cell of cellCollector.collect()) {
    balance = balance.add(cell.cell_output.capacity);
  }
  return "0x" + balance.toString(16);
}
