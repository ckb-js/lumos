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
  Tip,
} from "@ckb-lumos/base";
import { EventEmitter } from "events";
import { BIish } from "@ckb-lumos/bi";

export type ScriptType = "type" | "lock";
export type Order = "asc" | "desc";

export interface CKBIndexerQueryOptions extends QueryOptions {
  outputDataLenRange?: HexadecimalRange;
  outputCapacityRange?: HexadecimalRange;
  scriptLenRange?: HexadecimalRange;
  bufferSize?: number;
  withData?: boolean;
  groupByTransaction?: boolean;
}

export type HexadecimalRange = [Hexadecimal, Hexadecimal];
export interface SearchFilter {
  script?: Script;
  scriptLenRange?: HexadecimalRange;
  outputDataLenRange?: HexadecimalRange; //empty
  outputCapacityRange?: HexadecimalRange; //empty
  blockRange?: HexadecimalRange; //fromBlock-toBlock
}
export interface SearchKey {
  script: Script;
  scriptType: ScriptType;
  filter?: SearchFilter;
}
export interface GetLiveCellsResult<WithData extends boolean = true> {
  lastCursor: string;
  objects: WithData extends true ? IndexerCell[] : IndexerCellWithoutData[];
}

export interface GetCellsSearchKey<WithData extends boolean = boolean>
  extends SearchKey {
  withData?: WithData;
}

export interface GetTransactionsSearchKey<Group extends boolean = boolean>
  extends SearchKey {
  groupByTransaction?: Group;
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

export interface IndexerCellWithoutData
  extends Omit<IndexerCell, "outputData"> {
  outputData: null;
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
export type IndexerTransaction<Goruped extends boolean = false> =
  Goruped extends true
    ? GroupedIndexerTransaction
    : UngroupedIndexerTransaction;

export type UngroupedIndexerTransaction = {
  blockNumber: HexNum;
  ioIndex: HexNum;
  ioType: IOType;
  txHash: Bytes32;
  txIndex: HexNum;
};

export type GroupedIndexerTransaction = {
  txHash: Bytes32;
  blockNumber: HexNum;
  txIndex: HexNum;
  cells: Array<[IOType, HexNum]>;
};

export interface IndexerTransactionList<Grouped extends boolean = false> {
  lastCursor: string | undefined;
  objects: IndexerTransaction<Grouped>[];
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

export interface IndexerRpc {
  getTip: () => Promise<Tip>;

  getCells<WithData extends boolean = true>(
    searchKey: GetCellsSearchKey<WithData>,
    order: Order,
    limit: HexString,
    cursor?: string
  ): Promise<GetLiveCellsResult<WithData>>;

  getTransactions<Grouped extends boolean = false>(
    searchKey: GetTransactionsSearchKey<Grouped>,
    order: Order,
    limit: HexString,
    cursor?: string
  ): Promise<IndexerTransactionList<Grouped>>;
}
