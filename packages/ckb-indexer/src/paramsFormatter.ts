import { Script } from "@ckb-lumos/base";
import type * as RPCType from "./rpcType";
import { SearchKey, SearchFilter } from "./type";

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
  };
};

const toSearchKey = (data: SearchKey): RPCType.SearchKey => ({
  script: toScript(data.script),
  script_type: data.scriptType,
  filter: data.filter ? toSearchFilter(data.filter) : data.filter,
});

export { toScript, toSearchKey, toSearchFilter };
