import { OutPoint, Script, TransactionWithStatus } from "@ckb-lumos/base";
import type * as IndexerType from "./indexerType";
import type * as RPCType from "./rpcType";
import { SearchFilter, SearchKey } from "./type";
import { toTransaction } from "@ckb-lumos/rpc/lib/resultFormatter";

const toTip = (tip: RPCType.Tip): IndexerType.Tip => ({
  blockHash: tip.block_hash,
  blockNumber: tip.block_number,
});
const toScript = (data: RPCType.Script): Script => ({
  codeHash: data.code_hash,
  hashType: data.hash_type,
  args: data.args,
});
const toOutPoint = (data: RPCType.OutPoint): OutPoint => ({
  txHash: data.tx_hash,
  index: data.index,
});
const toCellOutPut = (data: RPCType.CellOutput): IndexerType.CellOutput => ({
  ...data,
  lock: toScript(data.lock),
  type: data.type ? toScript(data.type) : undefined,
});

const toSearchFilter = (data: RPCType.SearchFilter): SearchFilter => {
  return {
    script: data.script ? toScript(data.script) : data.script,
    outputDataLenRange: data.output_data_len_range,
    outputCapacityRange: data.output_capacity_range,
    scriptLenRange: data.script_len_range,
    blockRange: data.block_range,
  };
};

const toSearchKey = (data: RPCType.SearchKey): SearchKey => ({
  script: toScript(data.script),
  scriptType: data.script_type,
  filter: data.filter ? toSearchFilter(data.filter) : data.filter,
});

const toTransactionWithStatus = (
  data: RPCType.TransactionWithStatus
): TransactionWithStatus => ({
  transaction: toTransaction(data.transaction),
  txStatus: data.tx_status,
});

export {
  toTip,
  toScript,
  toOutPoint,
  toCellOutPut,
  toSearchKey,
  toSearchFilter,
  toTransactionWithStatus,
};
