import { PackParam } from "@ckb-lumos/codec";
import * as blockchain from "./blockchain";
import { Transaction, Block, Header, UncleBlock  } from '../lib/api';

declare type TransactionCodecType = PackParam<typeof blockchain.Transaction>;
declare type BlockCodecType = PackParam<typeof blockchain.Block>;
declare type UncleBlockCodecType = PackParam<typeof blockchain.UncleBlock>;
declare type HeaderCodecType = PackParam<typeof blockchain.Header>;

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
export function transformTransactionCodecType(data: Transaction): TransactionCodecType {
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

export function transformHeaderCodecType(data: Header): HeaderCodecType {
  return {
    raw: {
      timestamp: (data.timestamp),
      number: (data.number),
      epoch: (data.epoch),
      compactTarget: Number(data.compactTarget),
      dao: data.dao,
      parentHash: data.parentHash,
      proposalsHash: data.proposalsHash,
      transactionsRoot: data.transactionsRoot,
      extraHash: data.extraHash,
      version: (data.version),
    },
    nonce: (data.nonce),
  };
}

export function transformUncleBlockCodecType(data: UncleBlock): UncleBlockCodecType {
  return {
    header: transformHeaderCodecType(data.header),
    proposals: data.proposals,
  };
}

export function transformBlockCodecType(data: Block): BlockCodecType {
  return {
    header: transformHeaderCodecType(data.header),
    uncles: data.uncles.map(transformUncleBlockCodecType),
    transactions: data.transactions.map(transformTransactionCodecType),
    proposals: data.proposals,
  };
}
