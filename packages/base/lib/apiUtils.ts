import { UnpackResult } from '@ckb-lumos/codec/lib/base';
import { blockchain } from "@ckb-lumos/codec";
import { CellDep, Input, OutPoint, Output, Transaction } from './api';
import { BI } from '@ckb-lumos/bi';

type HeaderCodecType = UnpackResult<typeof blockchain.Header>
type CellOutputCodecType = UnpackResult<typeof blockchain.CellOutput>
type TransactionCodecType = UnpackResult<typeof blockchain.Transaction>
type RawTransactionCodecType = UnpackResult<typeof blockchain.RawTransaction>
type CellDepCodecType = UnpackResult<typeof blockchain.CellDep>
type OutPointCodecType = UnpackResult<typeof blockchain.OutPoint>
type CellInputCodecType = UnpackResult<typeof blockchain.CellInput>

export function transformCellInputCodecType(data: Input): CellInputCodecType {
  return {
    previous_output: transformOutPointCodecType(data.previous_output),
    since: BI.from(data.since)
  }
}
export function transformOutPointCodecType(data: OutPoint): OutPointCodecType {
  return {
    tx_hash: data.tx_hash,
    index: BI.from(data.index).toNumber()
  }
}
export function transformCellDepCodecType(data: CellDep): CellDepCodecType {
  return {
    out_point: transformOutPointCodecType(data.out_point),
    dep_type: data.dep_type
  }
}
export function transformCellOutputCodecType(data: Output): CellOutputCodecType {
  return {
    capacity: BI.from(data.capacity),
    lock: data.lock,
    type: data.type
  }
}
export function transformRawTransactionCodecType(data: Transaction): RawTransactionCodecType {
  return {
      version: BI.from(data.version).toNumber(),
      cell_deps: data.cell_deps.map(transformCellDepCodecType),
      header_deps: data.header_deps,
      inputs: data.inputs.map(transformCellInputCodecType),
      outputs: data.outputs.map(transformCellOutputCodecType),
      outputs_data: data.outputs_data,
  }
}
export function transformTransactionCodecType(data: Transaction): TransactionCodecType {
  return {
    raw: transformRawTransactionCodecType(data),
    witnesses: data.witnesses,
  }
}

// export const RawTransaction = table(
  // {
    // version: Uint32LE,
    // cell_deps: DeCellDepVec,
    // header_deps: Byte32Vec,
    // inputs: CellInputVec,
    // outputs: CellOutputVec,
    // outputs_data: BytesVec,
  // },
  // ["version", "cell_deps", "header_deps", "inputs", "outputs", "outputs_data"]
// );
// 
// export const Transaction = table(
  // {
    // raw: RawTransaction,
    // witnesses: BytesVec,
  // },
  // ["raw", "witnesses"]
// );