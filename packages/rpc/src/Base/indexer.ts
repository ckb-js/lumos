import { formatter as paramsFmts } from "../paramsFormatter";
import * as resultFmts from "../resultFormatter";

export default {
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
};
