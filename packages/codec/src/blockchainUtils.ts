import { BI } from "@ckb-lumos/bi";
import { UnpackResult } from "./base";
import * as blockchain from "./blockchain";
declare type CellOutputCodecType = UnpackResult<typeof blockchain.CellOutput>;
declare type TransactionCodecType = UnpackResult<typeof blockchain.Transaction>;
declare type RawTransactionCodecType = UnpackResult<
  typeof blockchain.RawTransaction
>;
declare type CellDepCodecType = UnpackResult<typeof blockchain.CellDep>;
declare type OutPointCodecType = UnpackResult<typeof blockchain.OutPoint>;
declare type CellInputCodecType = UnpackResult<typeof blockchain.CellInput>;
declare type BlockCodecType = UnpackResult<typeof blockchain.Block>;
declare type UncleBlockCodecType = UnpackResult<typeof blockchain.UncleBlock>;
declare type HeaderCodecType = UnpackResult<typeof blockchain.Header>;

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
export function transformCellInputCodecType(data: any): CellInputCodecType {
  // validators.ValidateCellInput(data);
  return {
    previousOutput: transformOutPointCodecType(data.previousOutput),
    since: BI.from(data.since),
  };
}
export function transformOutPointCodecType(data: any): OutPointCodecType {
  // validators.ValidateOutPoint(data);
  return {
    txHash: data.txHash,
    index: BI.from(data.index).toNumber(),
  };
}
export function transformCellDepCodecType(data: any): CellDepCodecType {
  // validators.ValidateCellDep(data);
  return {
    outPoint: transformOutPointCodecType(data.outPoint),
    depType: data.depType,
  };
}
export function transformCellOutputCodecType(data: any): CellOutputCodecType {
  // validators.ValidateCellOutput(data);
  return {
    capacity: BI.from(data.capacity),
    lock: data.lock,
    type: data.type,
  };
}
export function transformRawTransactionCodecType(
  data: any
): RawTransactionCodecType {
  // TODO maybe not apropriate to use this validator
  // validators.ValidateRawTransaction(data)
  return {
    version: BI.from(data.version).toNumber(),
    cellDeps: data.cellDeps.map(transformCellDepCodecType),
    headerDeps: data.headerDeps,
    inputs: data.inputs.map(transformCellInputCodecType),
    outputs: data.outputs.map(transformCellOutputCodecType),
    outputsData: data.outputsData,
  };
}

export function transformTransactionCodecType(data: any): TransactionCodecType {
  // validators.ValidateTransaction(data);
  return {
    raw: transformRawTransactionCodecType(data),
    witnesses: data.witnesses,
  };
}

export function transformHeaderCodecType(data: any): HeaderCodecType {
  // TODO what if hash is present here
  // validators.ValidateHeader(data);
  return {
    raw: {  
      timestamp: BI.from(data.timestamp),
      number: BI.from(data.number),
      epoch: BI.from(data.epoch),
      compactTarget: Number(data.compactTarget),
      dao: data.dao,
      parentHash: data.parentHash,
      proposalsHash: data.proposalsHash,
      transactionsRoot: data.transactionsRoot,
      extraHash: data.extraHash,
      version: Number(data.version),
    },
    nonce: BI.from(data.nonce),
  };
}

export function transformUncleBlockCodecType(data: any): UncleBlockCodecType {
  // validators.ValidateUncleBlock(data);
  return {
    header: transformHeaderCodecType(data.header),
    proposals: data.proposals,
  };
}

export function transformBlockCodecType(data: any): BlockCodecType {
  // validators.ValidateBlock(data);
  return {
    header: transformHeaderCodecType(data.header),
    uncles: data.uncles.map(transformUncleBlockCodecType),
    transactions: data.transactions.map(transformTransactionCodecType),
    proposals: data.proposals,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */