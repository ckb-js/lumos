import {
  HexString,
  Script,
  Cell,
  OutPoint,
  QueryOptions,
  Transaction,
  Output,
  values,
} from "@ckb-lumos/base";
import {
  TransactionCollector as TxCollector,
  Indexer,
} from "@ckb-lumos/indexer";
import {
  AccountExtendedPublicKey,
  AddressType,
  ExtendedPrivateKey,
} from "./extended_key";
import { Map, Set } from "immutable";
import { Config, getConfig } from "@ckb-lumos/config-manager";
import { publicKeyToBlake160 } from "./key";
import Keystore from "./keystore";
import { mnemonicToSeedSync } from "./mnemonic";

export function serializeOutPoint(outPoint: OutPoint): string {
  return `${outPoint.tx_hash}_${outPoint.index}`;
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

  static receivingKeyInitCount: number = 30;
  static changeKeyInitCount: number = 20;

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
    this.updateInfos(infos);
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

  updateInfos(infos: LockScriptMappingInfo[]): void {
    this.infos = infos;
    this.lockScriptInfos = this.getKeys()
      .map((publicKeyInfo) => {
        return infos.map((info) => {
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
    this.updateInfos(this.infos);
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
    const info: PublicKeyInfo = this.receivingKeys.find(
      (key) => key.historyTxCount === 0
    )!;
    return info;
  }

  getNextChangePublicKeyInfo(): PublicKeyInfo {
    const info: PublicKeyInfo = this.changeKeys.find(
      (key) => key.historyTxCount === 0
    )!;
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
  index: HexString
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

    const count: number = this.totalTransactionCountCache.get(key)!.size;
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
    publicKey: HexString
  ): void {
    const txHash: HexString = transaction.hash!;

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
          outputIndex
        );

        return cell;
      })
      .filter((output) => !!output) as Cell[];

    const inputOutPoints = transaction.inputs.map((input) => {
      return input.previous_output;
    });

    this.addTransactionCountCache(publicKey, txHash);

    outputs.forEach((output) => {
      const key = serializeOutPoint(output.out_point!);
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

  private lastTipBlockNumber: bigint = 0n;
  private TransactionCollector: any;

  constructor(
    indexer: Indexer,
    publicKey: HexString,
    chainCode: HexString,
    infos: LockScriptMappingInfo[],
    {
      TransactionCollector = TxCollector,
      masterPublicKey = undefined,
    }: {
      TransactionCollector?: any;
      masterPublicKey?: HexString;
    } = {}
  ) {
    this.indexer = indexer;
    this.hdCache = new HDCache(publicKey, chainCode, infos, masterPublicKey);
    this.txCache = new TransactionCache(this.hdCache);

    this.TransactionCollector = TransactionCollector;
  }

  getLastTipBlockNumber(): HexString {
    return "0x" + this.lastTipBlockNumber.toString(16);
  }

  async tip(): Promise<HexString> {
    const t = await this.indexer.tip();
    return t.block_number;
  }

  updateInfos(infos: LockScriptMappingInfo[]): void {
    this.hdCache.updateInfos(infos);
  }

  private async innerLoopTransactions(fromBlock: bigint, toBlock: bigint) {
    for (const lockScriptInfo of this.hdCache.getLockScriptInfos()) {
      const lockScript: Script = lockScriptInfo.lockScript;
      const transactionCollector = new this.TransactionCollector(
        this.indexer,
        {
          lock: lockScript,
          fromBlock: +fromBlock.toString(),
          toBlock: +toBlock.toString(),
        },
        {
          includeStatus: false,
        }
      );

      for await (const tx of transactionCollector.collect()) {
        this.txCache.parseTransaction(
          tx,
          lockScript,
          lockScriptInfo.publicKeyInfo.publicKey
        );
        this.hdCache.deriveKeys();
      }
    }
  }

  private async loopTransactions(tipBlockNumber: HexString) {
    const tip: bigint = BigInt(tipBlockNumber);
    if (tip <= this.lastTipBlockNumber) {
      return;
    }

    await this.innerLoopTransactions(this.lastTipBlockNumber + 1n, tip);
    this.lastTipBlockNumber = tip;
  }

  async loop() {
    const tipBlockNumber: HexString = (await this.indexer.tip()).block_number;
    await this.loopTransactions(tipBlockNumber);
  }
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
      publicKeyToArgs: publicKeyToBlake160,
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
    masterPublicKey?: HexString,
    infos: LockScriptMappingInfo[] = getDefaultInfos(),
    {
      logger = defaultLogger,
      pollIntervalSeconds = 2,
      livenessCheckIntervalSeconds = 5,
      TransactionCollector = TxCollector,
    }: {
      logger?: (level: string, message: string) => void;
      pollIntervalSeconds?: number;
      livenessCheckIntervalSeconds?: number;
      TransactionCollector?: any;
    } = {}
  ) {
    this.logger = logger;
    this.cache = new Cache(indexer, publicKey, chainCode, infos, {
      TransactionCollector,
      masterPublicKey,
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
      TransactionCollector?: any;
      needMasterPublicKey?: boolean;
    } = {}
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
      masterPublicKey,
      infos,
      options
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
      TransactionCollector?: any;
      needMasterPublicKey?: boolean;
    } = {}
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
      masterPublicKey,
      infos,
      options
    );
  }

  running(): boolean {
    return this.isRunning;
  }

  scheduleLoop() {
    setTimeout(() => {
      this.loop();
    }, this.pollIntervalSeconds * 1000);
  }

  stop() {
    this.isRunning = false;
  }

  async loop() {
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

  start() {
    this.isRunning = true;
    this.scheduleLoop();
  }

  startForever() {
    this.start();
    setInterval(() => {
      if (!this.running()) {
        this.logger("error", "Error occurs, maybe check the log?");
        this.start();
      }
    }, this.livenessCheckIntervalSeconds * 1000);
  }

  updateInfos(infos: LockScriptMappingInfo[]): void {
    this.cache.updateInfos(infos);
  }

  *cellCollector(): Generator<Cell> {
    const cells = this.cache.txCache.getLiveCellCache();
    for (const cell of cells.values()) {
      yield cell;
    }
  }

  // In fact, not support fromBlock | toBlock | skip now.
  *cellCollectorByQueryOptions({
    lock = undefined,
    type = undefined,
    argsLen = -1,
    data = "any",
    fromBlock = undefined,
    toBlock = undefined,
    skip = undefined,
  }: QueryOptions = {}): Generator<Cell> {
    for (const cell of this.cellCollector()) {
      if (
        this.checkCell(cell, {
          lock,
          type,
          argsLen,
          data,
          fromBlock,
          toBlock,
          skip,
        })
      ) {
        yield cell;
      }
    }
  }

  private checkCell(
    cell: Cell,
    {
      lock = undefined,
      type = undefined,
      argsLen = -1,
      data = "any",
      fromBlock = undefined,
      toBlock = undefined,
    }: QueryOptions
  ): boolean {
    lock = lock as Script | undefined;

    if (lock && argsLen === -1) {
      if (
        !new values.ScriptValue(cell.cell_output.lock, {
          validate: false,
        }).equals(new values.ScriptValue(lock, { validate: false }))
      ) {
        return false;
      }
    }
    if (lock && argsLen >= 0) {
      const length = argsLen * 2 + 2;
      const lockArgsLength = lock.args.length;
      const minLength = Math.min(length, lockArgsLength);

      const cellLock = cell.cell_output.lock;
      if (cellLock.args.length !== length) {
        return false;
      }
      if (
        !(
          cellLock.code_hash === lock.code_hash &&
          cellLock.hash_type === lock.hash_type &&
          cellLock.args.slice(0, minLength) === lock.args.slice(0, minLength)
        )
      ) {
        return false;
      }
    }

    if (type && type === "empty" && cell.cell_output.type) {
      return false;
    }
    if (type && typeof type === "object") {
      if (
        !cell.cell_output.type ||
        !new values.ScriptValue(cell.cell_output.type, {
          validate: false,
        }).equals(new values.ScriptValue(type as Script, { validate: false }))
      ) {
        return false;
      }
    }
    if (data && data !== "any" && cell.data !== data) {
      return false;
    }
    if (cell.block_number && BigInt(cell.block_number) < BigInt(fromBlock)) {
      return false;
    }
    if (cell.block_number && BigInt(cell.block_number) > BigInt(toBlock)) {
      return false;
    }

    return true;
  }

  getBalance(queryOptions: QueryOptions | "any" = "any"): HexString {
    let balance: bigint = 0n;
    if (queryOptions === "any") {
      for (const cell of this.cellCollector()) {
        balance += BigInt(cell.cell_output.capacity);
      }
    } else {
      for (const cell of this.cellCollectorByQueryOptions(queryOptions)) {
        balance += BigInt(cell.cell_output.capacity);
      }
    }
    return "0x" + balance.toString(16);
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
