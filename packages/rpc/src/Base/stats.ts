import * as resultFmts from "../resultFormatter";

export default {
  getBlockchainInfo: {
    method: "get_blockchain_info",
    paramsFormatters: [],
    resultFormatters: resultFmts.toBlockchainInfo,
  },
};
