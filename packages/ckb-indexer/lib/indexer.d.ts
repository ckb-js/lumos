/// <reference types="node" />
import { Cell, CellCollector, Hexadecimal, HexString, Indexer, QueryOptions, Script, Tip, OutPoint, HexNumber } from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc";
export declare enum ScriptType {
    type = "type",
    lock = "lock"
}
export declare enum Order {
    asc = "asc",
    desc = "desc"
}
export declare type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchKey {
    script: Script;
    script_type: ScriptType;
    filter?: {
        script?: Script;
        output_data_len_range?: HexadecimalRange;
        output_capacity_range?: HexadecimalRange;
        block_range?: HexadecimalRange;
    };
}
export interface GetLiveCellsResult {
    last_cursor: string;
    objects: IndexerCell[];
}
export interface rpcResponse {
    status: number;
    data: rpcResponseData;
}
export interface rpcResponseData {
    result: string;
    error: string;
}
export interface IndexerCell {
    block_number: Hexadecimal;
    out_point: OutPoint;
    output: {
        capacity: HexNumber;
        lock: Script;
        type?: Script;
    };
    output_data: HexString;
    tx_index: Hexadecimal;
}
export interface TerminatorResult {
    stop: boolean;
    push: boolean;
}
export declare type Terminator = (index: number, cell: Cell) => TerminatorResult;
export declare type HexNum = string;
export declare type IOType = "input" | "output";
export declare type Bytes32 = string;
export declare type GetTransactionsResult = {
    block_number: HexNum;
    io_index: HexNum;
    io_type: IOType;
    tx_hash: Bytes32;
    tx_index: HexNum;
};
export interface GetTransactionsResults {
    last_cursor: string;
    objects: GetTransactionsResult[];
}
export declare class CkbIndexer implements Indexer {
    ckbRpcUrl: string;
    ckbIndexerUrl: string;
    uri: string;
    constructor(ckbRpcUrl: string, ckbIndexerUrl: string);
    getCkbRpc(): RPC;
    tip(): Promise<Tip>;
    asyncSleep(timeout: number): Promise<void>;
    waitForSync(blockDifference?: number): Promise<void>;
    collector(queries: QueryOptions): CellCollector;
    request(method: string, params?: any, ckbIndexerUrl?: string): Promise<any>;
    getCells(searchKey: SearchKey, terminator?: Terminator, { sizeLimit, order, }?: {
        sizeLimit?: number;
        order?: Order;
    }): Promise<Cell[]>;
    getTransactions(searchKey: SearchKey, { sizeLimit, order, }?: {
        sizeLimit?: number;
        order?: Order;
    }): Promise<GetTransactionsResult[]>;
    running(): boolean;
    start(): void;
    startForever(): void;
    stop(): void;
    subscribe(queries: QueryOptions): NodeJS.EventEmitter;
    subscribeMedianTime(): NodeJS.EventEmitter;
}
