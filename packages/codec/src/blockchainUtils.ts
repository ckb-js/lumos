import { BI } from "@ckb-lumos/bi";
import { UnpackResult } from "./base";
import * as blockchain from "./blockchain";
declare type TransactionCodecType = UnpackResult<typeof blockchain.Transaction>;
declare type BlockCodecType = UnpackResult<typeof blockchain.Block>;
declare type UncleBlockCodecType = UnpackResult<typeof blockchain.UncleBlock>;
declare type HeaderCodecType = UnpackResult<typeof blockchain.Header>;

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
/**
 * from Transantion defined in  @ckb-lumos/base/lib/api.d.ts
 * ```
 * export interface Transaction {
 *  cellDeps: CellDep[];
 *  hash?: Hash;
 *  headerDeps: Hash[];
 *  inputs: Input[];
 *  outputs: Output[];
 *  outputsData: HexString[];
 *  version: HexNumber;
 *  witnesses: HexString[];
 *}
 * to :
 * interface TransactionCodecType {
 *   raw: {
 *     version: Uint32LE;
 *     cellDeps: DeCellDepVec;
 *     headerDeps: Byte32Vec;
 *     inputs: CellInputVec;
 *     outputs: CellOutputVec;
 *     outputsData: BytesVec;
 *   };
 *   witnesses: BytesVec;
 * }
 * ```
 * @param data Transantion defined in @ckb-lumos/base/lib/api.d.ts
 * @returns TransactionCodecType
 */
export function transformTransactionCodecType(data: any): TransactionCodecType {
  return {
    raw: {
      version: data.version,
      cellDeps: data.cellDeps,
      headerDeps: data.headerDeps,
      inputs: data.inputs,
      outputs: data.outputs,
      outputsData: data.outputsData,
    },
    witnesses: data.witnesses,
  };
}

export function transformHeaderCodecType(data: any): HeaderCodecType {
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
  return {
    header: transformHeaderCodecType(data.header),
    proposals: data.proposals,
  };
}

export function transformBlockCodecType(data: any): BlockCodecType {
  return {
    header: transformHeaderCodecType(data.header),
    uncles: data.uncles.map(transformUncleBlockCodecType),
    transactions: data.transactions.map(transformTransactionCodecType),
    proposals: data.proposals,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
