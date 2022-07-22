/// <reference types="node" />
import { CellCollector, Indexer, Tip } from "@ckb-lumos/base";
import { EventEmitter } from "events";
import { CKBIndexerQueryOptions, GetCellsResults, IndexerTransactionList, IndexerEmitter, SearchKey, SearchKeyFilter, Terminator, OtherQueryOptions } from "./type";
/** CkbIndexer.collector will not get cell with blockHash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get blockHash if you need. */
export declare class CkbIndexer implements Indexer {
    ckbIndexerUrl: string;
    ckbRpcUrl: string;
    uri: string;
    medianTimeEmitters: EventEmitter[];
    emitters: IndexerEmitter[];
    isSubscribeRunning: boolean;
    constructor(ckbIndexerUrl: string, ckbRpcUrl: string);
    private getCkbRpc;
    tip(): Promise<Tip>;
    asyncSleep(timeout: number): Promise<void>;
    waitForSync(blockDifference?: number): Promise<void>;
    /** collector cells without blockHash by default.if you need blockHash, please add OtherQueryOptions.withBlockHash and OtherQueryOptions.ckbRpcUrl.
     * don't use OtherQueryOption if you don't need blockHash,cause it will slowly your collect.
     */
    collector(queries: CKBIndexerQueryOptions, otherQueryOptions?: OtherQueryOptions): CellCollector;
    private request;
    getCells(searchKey: SearchKey, terminator?: Terminator, searchKeyFilter?: SearchKeyFilter): Promise<GetCellsResults>;
    getTransactions(searchKey: SearchKey, searchKeyFilter?: SearchKeyFilter): Promise<IndexerTransactionList>;
    running(): boolean;
    start(): void;
    startForever(): void;
    stop(): void;
    subscribe(queries: CKBIndexerQueryOptions): EventEmitter;
    private loop;
    private scheduleLoop;
    private poll;
    private publishAppendBlockEvents;
    private filterEvents;
    private checkFilterOptions;
    private checkArgs;
    private emitMedianTimeEvents;
    subscribeMedianTime(): EventEmitter;
}
