import {
  HexString,
  HexNumber,
  Hash,
  Hexadecimal,
  TxStatus,
} from "@ckb-lumos/base";
import { RPC } from "@ckb-lumos/rpc/lib/types/rpc";

export type Tip = {
  block_hash: HexNumber;
  block_number: HexString;
};
export type Script = {
  code_hash: HexString;
  hash_type: "type" | "data" | "data1";
  args: HexString;
};
export interface OutPoint {
  tx_hash: Hash;
  index: HexNumber;
}
export type CellOutput = {
  capacity: HexNumber;
  lock: Script;
  type?: Script;
};

export type HexadecimalRange = [Hexadecimal, Hexadecimal];
export type ScriptType = "type" | "lock";

export interface SearchFilter {
  script?: Script;
  output_data_len_range?: HexadecimalRange; //empty
  output_capacity_range?: HexadecimalRange; //empty
  block_range?: HexadecimalRange; //fromBlock-toBlock
  script_len_range?: HexadecimalRange;
}
export interface SearchKey {
  script: Script;
  script_type: ScriptType;
  filter?: SearchFilter;
}
export interface GetCellsSearchKey extends SearchKey {
  with_data?: boolean;
}

export interface GetTransactionsSearchKey extends SearchKey {
  group_by_transaction?: boolean;
}

export interface TransactionWithStatus {
  transaction: RPC.Transaction;
  tx_status: TxStatus;
}

export interface GetTransactionRPCResult {
  jsonrpc: string;
  id: number;
  result: TransactionWithStatus;
}
