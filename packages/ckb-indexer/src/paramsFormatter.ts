import { Script } from "@ckb-lumos/base";
import type * as RPCType from "./rpcType";
import {
  SearchKey,
  SearchFilter,
  GetCellsSearchKey,
  GetTransactionsSearchKey,
} from "./type";

const toScript = (data: Script): RPCType.Script => ({
  code_hash: data.codeHash,
  hash_type: data.hashType,
  args: data.args,
});

const toSearchFilter = (data: SearchFilter): RPCType.SearchFilter => {
  return {
    script: data.script ? toScript(data.script) : data.script,
    output_data_len_range: data.outputDataLenRange,
    output_capacity_range: data.outputCapacityRange,
    block_range: data.blockRange,
    script_len_range: data.scriptLenRange,
  };
};

const toSearchKey = (data: SearchKey): RPCType.SearchKey => ({
  script: toScript(data.script),
  script_type: data.scriptType,
  filter: data.filter ? toSearchFilter(data.filter) : data.filter,
  script_search_mode: data.scriptSearchMode ? data.scriptSearchMode : "prefix",
});

const toGetCellsSearchKey = (
  data: GetCellsSearchKey
): RPCType.GetCellsSearchKey => ({
  ...toSearchKey(data),
  with_data: data.withData,
});

const toGetTransactionsSearchKey = (
  data: GetTransactionsSearchKey<boolean>
): RPCType.GetTransactionsSearchKey => ({
  ...toSearchKey(data),
  group_by_transaction: data.groupByTransaction,
});

export {
  toScript,
  toSearchKey,
  toGetCellsSearchKey,
  toGetTransactionsSearchKey,
  toSearchFilter,
};
