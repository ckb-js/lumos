import {
  Cell,
  Hexadecimal,
  HexString,
  QueryOptions,
  OutPoint,
  HexNumber,
  Output,
  TransactionWithStatus,
  Script,
} from "@ckb-lumos/base";
import { EventEmitter } from "events";
import { BIish } from "@ckb-lumos/bi";

export type ScriptType = "type" | "lock";
export type Order = "asc" | "desc";

export interface CKBIndexerQueryOptions extends QueryOptions {
  outputDataLenRange?: HexadecimalRange;
  outputCapacityRange?: HexadecimalRange;
  bufferSize?: number;
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchFilter {
  script?: Script;
  outputDataLenRange?: HexadecimalRange; //empty
  outputCapacityRange?: HexadecimalRange; //empty
  blockRange?: HexadecimalRange; //fromBlock-toBlock
}
export interface SearchKey {
  script: Script;
  scriptType: ScriptType;
  filter?: SearchFilter;
}
export interface GetLiveCellsResult {
  lastCursor: string;
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
  outputData: HexString;
  txIndex: Hexadecimal;
}
export interface TerminatorResult {
  stop: boolean;
  push: boolean;
}

export declare type Terminator = (
  index: number,
  cell: Cell
) => TerminatorResult;

export type HexNum = string;
export type IOType = "input" | "output" | "both";
export type Bytes32 = string;
export type IndexerTransaction = {
  blockNumber: HexNum;
  ioIndex: HexNum;
  ioType: IOType;
  txHash: Bytes32;
  txIndex: HexNum;
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

export class IndexerEmitter extends EventEmitter {
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
