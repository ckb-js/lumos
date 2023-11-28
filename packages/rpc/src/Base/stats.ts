import * as resultFmts from "../resultFormatter";

export default {
  getBlockchainInfo: {
    method: "get_blockchain_info",
    paramsFormatters: [],
    resultFormatters: resultFmts.toBlockchainInfo,
  },
  getDeploymentsInfo: {
    method: "get_deployments_info",
    paramsFormatters: [],
    resultFormatters: resultFmts.toDeploymentsInfo,
  },
};
