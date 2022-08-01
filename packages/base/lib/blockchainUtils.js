"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transformBlockCodecType = transformBlockCodecType;
exports.transformHeaderCodecType = transformHeaderCodecType;
exports.transformTransactionCodecType = transformTransactionCodecType;
exports.transformUncleBlockCodecType = transformUncleBlockCodecType;

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
function transformTransactionCodecType(data) {
  return {
    raw: {
      version: data.version,
      cellDeps: data.cellDeps,
      headerDeps: data.headerDeps,
      inputs: data.inputs,
      outputs: data.outputs,
      outputsData: data.outputsData
    },
    witnesses: data.witnesses
  };
}

function transformHeaderCodecType(data) {
  return {
    raw: {
      timestamp: data.timestamp,
      number: data.number,
      epoch: data.epoch,
      compactTarget: Number(data.compactTarget),
      dao: data.dao,
      parentHash: data.parentHash,
      proposalsHash: data.proposalsHash,
      transactionsRoot: data.transactionsRoot,
      extraHash: data.extraHash,
      version: data.version
    },
    nonce: data.nonce
  };
}

function transformUncleBlockCodecType(data) {
  return {
    header: transformHeaderCodecType(data.header),
    proposals: data.proposals
  };
}

function transformBlockCodecType(data) {
  return {
    header: transformHeaderCodecType(data.header),
    uncles: data.uncles.map(transformUncleBlockCodecType),
    transactions: data.transactions.map(transformTransactionCodecType),
    proposals: data.proposals
  };
}
//# sourceMappingURL=blockchainUtils.js.map