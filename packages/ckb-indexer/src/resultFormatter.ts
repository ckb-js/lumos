import { OutPoint, Script } from '@ckb-lumos/base';
import { IndexerType } from "./indexerType";
import { RPCType } from "./rpcType";

const toTip = (tip: RPCType.Tip): IndexerType.Tip => ({
  blockHash: tip.block_hash,
  blockNumber: tip.block_number
})
const toScript = (data: RPCType.Script): Script => ({
  codeHash: data.code_hash,
  hashType: data.hash_type,
  args: data.args
})
const toOutPoint = (data: RPCType.OutPoint): OutPoint => ({
  txHash: data.tx_hash,
  index: data.index
})
const toCellOutPut = (data: RPCType.CellOutput): IndexerType.CellOutput => ({
  ...data,
  lock: toScript(data.lock),
  type: data.type ? toScript(data.type): undefined,
})

export {
  toTip,toScript, toOutPoint, toCellOutPut
};
