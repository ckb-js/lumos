/// <reference types="node" />
import { Cell, Hexadecimal, HexString, QueryOptions, Script, OutPoint, HexNumber, Output, TransactionWithStatus } from "@ckb-lumos/base";
import { EventEmitter } from "events";
import { BIish } from "@ckb-lumos/bi";
export declare type ScriptType = "type" | "lock";
export declare type Order = "asc" | "desc";
export interface CKBIndexerQueryOptions extends QueryOptions {
    outputDataLenRange?: HexadecimalRange;
    outputCapacityRange?: HexadecimalRange;
    bufferSize?: number;
}
export declare type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchFilter {
    script?: Script;
    output_data_len_range?: HexadecimalRange;
    output_capacity_range?: HexadecimalRange;
    block_range?: HexadecimalRange;
}
export interface SearchKey {
    script: Script;
    script_type: ScriptType;
    filter?: SearchFilter;
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
    blockNumber: Hexadecimal;
    outPoint: OutPoint;
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
export declare type IOType = "input" | "output" | "both";
export declare type Bytes32 = string;
export declare type IndexerTransaction = {
    blockNumber: HexNum;
    io_index: HexNum;
    io_type: IOType;
    txHash: Bytes32;
    tx_index: HexNum;
};
export interface IndexerTransactionList {
    lastCursor: string | undefined;
    objects: IndexerTransaction[];
}
export interface GetCellsResults {
    lastCursor: string;
    objects: Cell[];
}
export interface SearchKeyFilter {
    sizeLimit?: number;
    order?: Order;
    lastCursor?: string | undefined;
}
export interface OutputToVerify {
    output: Output;
    outputData: string;
}
export declare class IndexerEmitter extends EventEmitter {
    lock?: Script;
    type?: Script;
    outputData?: HexString | "any";
    argsLen?: number | "any";
    fromBlock?: BIish;
}
export interface OtherQueryOptions {
    withBlockHash: true;
    ckbRpcUrl: string;
}
export interface GetTransactionRPCResult {
    jsonrpc: string;
    id: number;
    result: TransactionWithStatus;
}
export interface JsonRprRequestBody {
    id: string | number;
    jsonrpc: string;
    method: string;
    params: string[];
}