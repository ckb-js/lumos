import { formatter as paramsFmts } from "../paramsFormatter";
export default {
  dryRunTransaction: {
    method: "dry_run_transaction",
    paramsFormatters: [paramsFmts.toRawTransaction],
  },

  // skip _compute_transaction_hash

  calculateDaoMaximumWithdraw: {
    method: "calculate_dao_maximum_withdraw",
    paramsFormatters: [paramsFmts.toOutPoint, paramsFmts.toHash],
  },

  // skip estimate_fee_rate

  // skip _compute_script_hash
};
