import { HexString, Script, Cell, OutPoint, QueryOptions, Transaction, CellCollector as CellCollectorInterface, Indexer, TransactionCollector as BaseTransactionCollector } from "@ckb-lumos/base";
import { Map } from "immutable";
import { Config } from "@ckb-lumos/config-manager";
import RPC from "@ckb-lumos/rpc";
export declare function serializeOutPoint(outPoint: OutPoint): string;
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
    codeHash: HexString;
    hashType: "data" | "type";
    publicKeyToArgs: (publicKey: HexString) => HexString;
}
export declare class HDCache {
    private masterPublicKeyInfo?;
    private publicKey;
    private chainCode;
    private accountExtendedPublicKey;
    readonly receivingKeys: PublicKeyInfo[];
    readonly changeKeys: PublicKeyInfo[];
    private lockScriptInfos;
    private infos;
    static receivingKeyThreshold: number;
    static changeKeyThreshold: number;
    static receivingKeyInitCount: number;
    static changeKeyInitCount: number;
    constructor(publicKey: HexString, chainCode: HexString, infos?: LockScriptMappingInfo[], masterPublicKey?: HexString);
    getMasterPublicKeyInfo(): PublicKeyInfo | undefined;
    updateMasterPublicKeyHistoryTxCount(count: number): void;
    getLockScriptInfos(): LockScriptInfo[];
    resetLockScripts(): void;
    getKeys(): PublicKeyInfo[];
    private init;
    deriveKeys(): void;
    private checkAndDeriveReceivingKeys;
    private deriveReceivingKeys;
    private checkAndDeriveChangeKeys;
    private deriveChangeKeys;
    getNextReceivingPublicKeyInfo(): PublicKeyInfo;
    getNextChangePublicKeyInfo(): PublicKeyInfo;
    private generatePublicKeyInfo;
}
export declare class TransactionCache {
    private totalTransactionCountCache;
    private liveCellCache;
    private hdCache;
    constructor(hdCache: HDCache);
    getLiveCellCache(): Map<string, Cell>;
    addTransactionCountCache(key: HexString, value: HexString): void;
    parseTransaction(transaction: Transaction, lockScript: Script, publicKey: HexString, blockHash: HexString, blockNumber: HexString): void;
}
export declare class Cache {
    readonly hdCache: HDCache;
    readonly txCache: TransactionCache;
    private indexer;
    private lastTipBlockNumber;
    private TransactionCollector;
    private rpc;
    constructor(indexer: Indexer, publicKey: HexString, chainCode: HexString, infos: LockScriptMappingInfo[], { TransactionCollector, masterPublicKey, rpc, }: {
        TransactionCollector: typeof BaseTransactionCollector;
        masterPublicKey?: HexString;
        rpc?: RPC;
    });
    getLastTipBlockNumber(): HexString;
    tip(): Promise<HexString>;
    private innerLoopTransactions;
    private loopTransactions;
    loop(): Promise<void>;
}
export declare function publicKeyToMultisigArgs(publicKey: HexString): HexString;
export declare function getDefaultInfos(config?: Config | undefined): LockScriptMappingInfo[];
export declare class CacheManager {
    private cache;
    private logger;
    private isRunning;
    private livenessCheckIntervalSeconds;
    private pollIntervalSeconds;
    constructor(indexer: Indexer, publicKey: HexString, chainCode: HexString, infos: LockScriptMappingInfo[] | undefined, { TransactionCollector, logger, pollIntervalSeconds, livenessCheckIntervalSeconds, rpc, }: {
        TransactionCollector: typeof BaseTransactionCollector;
        logger?: (level: string, message: string) => void;
        pollIntervalSeconds?: number;
        livenessCheckIntervalSeconds?: number;
        rpc?: RPC;
    }, masterPublicKey?: HexString);
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
    static loadFromKeystore(indexer: Indexer, path: string, password: string, infos: LockScriptMappingInfo[] | undefined, options: {
        logger?: (level: string, message: string) => void;
        pollIntervalSeconds?: number;
        livenessCheckIntervalSeconds?: number;
        TransactionCollector: typeof BaseTransactionCollector;
        needMasterPublicKey?: boolean;
        rpc?: RPC;
    }): CacheManager;
    static fromMnemonic(indexer: Indexer, mnemonic: string, infos: LockScriptMappingInfo[] | undefined, options: {
        logger?: (level: string, message: string) => void;
        pollIntervalSeconds?: number;
        livenessCheckIntervalSeconds?: number;
        TransactionCollector: typeof BaseTransactionCollector;
        needMasterPublicKey?: boolean;
        rpc?: RPC;
    }): CacheManager;
    running(): boolean;
    scheduleLoop(): void;
    stop(): void;
    loop(): Promise<void>;
    start(): void;
    startForever(): void;
    getLiveCellsCache(): Map<string, Cell>;
    getMasterPublicKeyInfo(): PublicKeyInfo | undefined;
    getNextReceivingPublicKeyInfo(): PublicKeyInfo;
    getNextChangePublicKeyInfo(): PublicKeyInfo;
    getReceivingKeys(): PublicKeyInfo[];
    getChangeKeys(): PublicKeyInfo[];
}
export declare class CellCollector implements CellCollectorInterface {
    private cacheManager;
    constructor(cacheManger: CacheManager);
    collect(): AsyncGenerator<Cell>;
}
export declare class CellCollectorWithQueryOptions implements CellCollectorInterface {
    private collector;
    private queryOptions;
    constructor(collector: CellCollector, { lock, type, argsLen, data, fromBlock, toBlock, skip, }?: QueryOptions);
    collect(): AsyncGenerator<Cell>;
}
export declare function getBalance(cellCollector: CellCollectorInterface): Promise<HexString>;
export {};
