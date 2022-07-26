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
import { RPCType } from "./rpcType";

export type ScriptType = "type" | "lock";
export type Order = "asc" | "desc";

export interface CKBIndexerQueryOptions extends QueryOptions {
  outputDataLenRange?: HexadecimalRange;
  outputCapacityRange?: HexadecimalRange;
  bufferSize?: number;
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchFilter {
  script?: RPCType.Script;
  output_data_len_range?: HexadecimalRange; //empty
  output_capacity_range?: HexadecimalRange; //empty
  block_range?: HexadecimalRange; //fromBlock-toBlock
}
export interface SearchKey {
  script: RPCType.Script;
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
  block_number: Hexadecimal;
  out_point: RPCType.OutPoint;
  output: {
    capacity: HexNumber;
    lock: RPCType.Script;
    type?: RPCType.Script;
  };
  output_data: HexString;
  tx_index: Hexadecimal;
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
  block_number: HexNum;
  io_index: HexNum;
  io_type: IOType;
  tx_hash: Bytes32;
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
