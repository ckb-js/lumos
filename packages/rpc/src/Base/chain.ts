import paramsFmts from '../paramsFormatter'
import resultFmts from '../resultFormatter'

export default {
  getTipBlockNumber: {
    method: 'get_tip_block_number',
    paramsFormatters: [],
    resultFormatters: resultFmts.toNumber,
  },

  getTipHeader: {
    method: 'get_tip_header',
    paramsFormatters: [],
    resultFormatters: resultFmts.toHeader,
  },

  getCurrentEpoch: {
    method: 'get_current_epoch',
    paramsFormatters: [],
    resultFormatters: resultFmts.toEpoch,
  },

  getEpochByNumber: {
    method: 'get_epoch_by_number',
    paramsFormatters: [paramsFmts.toNumber],
    resultFormatters: resultFmts.toEpoch,
  },

  getBlockHash: {
    method: 'get_block_hash',
    paramsFormatters: [paramsFmts.toNumber],
  },

  getBlock: {
    method: 'get_block',
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toBlock,
  },

  getBlockByNumber: {
    method: 'get_block_by_number',
    paramsFormatters: [paramsFmts.toNumber],
    resultFormatters: resultFmts.toBlock,
  },

  getHeader: {
    method: 'get_header',
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toHeader,
  },

  getHeaderByNumber: {
    method: 'get_header_by_number',
    paramsFormatters: [paramsFmts.toNumber],
    resultFormatters: resultFmts.toHeader,
  },

  getLiveCell: {
    method: 'get_live_cell',
    paramsFormatters: [paramsFmts.toOutPoint],
    resultFormatters: resultFmts.toLiveCellWithStatus,
  },

  getTransaction: {
    method: 'get_transaction',
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toTransactionWithStatus,
  },

  getCellbaseOutputCapacityDetails: {
    method: 'get_cellbase_output_capacity_details',
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toCellbaseOutputCapacityDetails,
  },

  getBlockEconomicState: {
    method: 'get_block_economic_state',
    paramsFormatters: [paramsFmts.toHash],
    resultFormatters: resultFmts.toBlockEconomicState,
  },

  getTransactionProof: {
    method: 'get_transaction_proof',
    paramsFormatters: [paramsFmts.toArray(paramsFmts.toHash), paramsFmts.toOptional(paramsFmts.toHash)],
    resultFormatters: resultFmts.toTransactionProof,
  },

  verifyTransactionProof: {
    method: 'verify_transaction_proof',
    paramsFormatters: [paramsFmts.toTransactionProof],
  },

  getConsensus: {
    method: 'get_consensus',
    paramsFormatters: [],
    resultFormatters: resultFmts.toConsensus,
  },
}
