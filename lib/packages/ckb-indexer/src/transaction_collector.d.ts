import { TransactionCollectorOptions, indexer as BaseIndexerModule, Output, TransactionWithStatus, TransactionCollector as BaseTransactionCollector, Transaction } from "@ckb-lumos/base";
import { CKBIndexerQueryOptions, IndexerTransaction, IndexerTransactionList, GetTransactionRPCResult, JsonRprRequestBody } from "./type";
import { CkbIndexer } from "./indexer";
interface GetTransactionDetailResult {
    objects: TransactionWithStatus[];
    lastCursor: string | undefined;
}
export declare class CKBIndexerTransactionCollector extends BaseIndexerModule.TransactionCollector {
    indexer: CkbIndexer;
    queries: CKBIndexerQueryOptions;
    CKBRpcUrl: string;
    options?: TransactionCollectorOptions | undefined;
    filterOptions: TransactionCollectorOptions;
    constructor(indexer: CkbIndexer, queries: CKBIndexerQueryOptions, CKBRpcUrl: string, options?: TransactionCollectorOptions | undefined);
    static asBaseTransactionCollector(CKBRpcUrl: string): typeof BaseTransactionCollector;
    fetchIndexerTransaction(queries: CKBIndexerQueryOptions, lastCursor?: string): Promise<IndexerTransactionList>;
    getResolvedTransactionRequestPayload(unresolvedTransactionList: TransactionWithStatus[], indexerTransactionList: IndexerTransactionList): JsonRprRequestBody[];
    fetchResolvedTransaction(txIoTypeInputOutPointList: JsonRprRequestBody[]): Promise<GetTransactionRPCResult[]>;
    getResolvedCell(unresolvedTransaction: TransactionWithStatus, resolvedTransactionList: GetTransactionRPCResult[], indexerTransaction: IndexerTransaction): Output;
    filterTransaction(unresolvedTransactionList: TransactionWithStatus[], resolvedTransactionList: GetTransactionRPCResult[], indexerTransactionList: IndexerTransactionList): TransactionWithStatus[];
    getTransactions(lastCursor?: string): Promise<GetTransactionDetailResult>;
    private getTransactionByLockAndTypeIndependent;
    private getTransactionListFromRpc;
    private isLockArgsLenMatched;
    private isCellScriptArgsValid;
    private filterByIoType;
    private filterByTypeIoTypeAndLockIoType;
    count(): Promise<number>;
    getTransactionHashes(): Promise<string[]>;
    collect(): AsyncGenerator<TransactionWithStatus | Transaction, undefined, unknown>;
}
export {};
