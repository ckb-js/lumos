import paramsFmts from "../paramsFormatter";
import resultFmts from "../resultFormatter";

export default {
  sendTransaction: {
    method: "send_transaction",
    paramsFormatters: [paramsFmts.toRawTransaction, paramsFmts.toOutputsValidator],
    resultFormatters: resultFmts.toHash,
  },

  txPoolInfo: {
    method: "tx_pool_info",
    paramsFormatters: [],
    resultFormatters: resultFmts.toTxPoolInfo,
  },

  clearTxPool: {
    method: "clear_tx_pool",
    paramsFormatters: [],
  },

  getRawTxPool: {
    method: "get_raw_tx_pool",
    paramsFormatters: [],
    resultFormatters: resultFmts.toRawTxPool,
  },
};
