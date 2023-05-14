import { formatter as paramsFmts } from "../paramsFormatter";
import * as resultFmts from "../resultFormatter";
/* eslint-disable @typescript-eslint/no-explicit-any */

type MethodSchema = {
  method: string;
  paramsFormatters: ((arg: any) => any)[];
  resultFormatters: (arg: any) => any;
};

const schemas: Record<string, MethodSchema> = {
  getIndexerTip: {
    method: "get_indexer_tip",
    paramsFormatters: [],
    resultFormatters: resultFmts.toTip,
  },

  getCells: {
    method: "get_cells",
    paramsFormatters: [
      paramsFmts.toGetCellsSearchKey,
      paramsFmts.toOrder,
      paramsFmts.toNumber,
      paramsFmts.toOptional(paramsFmts.toHash),
    ],
    resultFormatters: resultFmts.toGetCellsResult,
  },

  getTransactions: {
    method: "get_transactions",
    paramsFormatters: [
      paramsFmts.toGetTransactionsSearchKey,
      paramsFmts.toOrder,
      paramsFmts.toNumber,
      paramsFmts.toOptional(paramsFmts.toHash),
    ],
    resultFormatters: resultFmts.toGetTransactionsResult,
  },

  getCellsCapacity: {
    method: "get_cells_capacity",
    paramsFormatters: [paramsFmts.toSearchKey],
    resultFormatters: resultFmts.toCellsCapacity,
  },

  getBlockFilter: {
    method: "get_block_filter",
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toNullable(resultFmts.toBlockFilter),
  },
  getTransactionAndWitnessProof: {
    method: "get_transaction_and_witness_proof",
    paramsFormatters: [
      paramsFmts.toArray(paramsFmts.toHash),
      paramsFmts.toOptional(paramsFmts.toHash),
    ],
    resultFormatters: resultFmts.toTransactionAndWitnessProof,
  },
  verifyTransactionAndWitnessProof: {
    method: "verify_transaction_and_witness_proof",
    paramsFormatters: [paramsFmts.toTransactionAndWitnessProof],
    resultFormatters: resultFmts.toArray(resultFmts.toHash),
  },

  getForkBlock: {
    method: "get_fork_block",
    paramsFormatters: [
      paramsFmts.toHash,
      paramsFmts.toOptional(paramsFmts.toNumber),
    ],
    resultFormatters: resultFmts.toNullable(resultFmts.toForkBlockResult),
  },

  getBlockMedianTime: {
    method: "get_block_median_time",
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toNullable(resultFmts.toNumber),
  },

  estimateCycles: {
    method: "estimate_cycles",
    paramsFormatters: [paramsFmts.toRawTransaction],
    resultFormatters: resultFmts.toEstimateCycles,
  },

  getFeeRateStatistics: {
    method: "get_fee_rate_statistics",
    paramsFormatters: [paramsFmts.toOptional(paramsFmts.toNumber)],
    resultFormatters: resultFmts.toNullable(resultFmts.toFeeRateStatistics),
  },

  getFeeRateStatics: {
    method: "get_fee_rate_statics",
    paramsFormatters: [paramsFmts.toOptional(paramsFmts.toNumber)],
    resultFormatters: resultFmts.toNullable(resultFmts.toFeeRateStatistics),
  },
};

export default schemas;
