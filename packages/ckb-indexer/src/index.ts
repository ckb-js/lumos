import { CKBCellCollector } from "./collector";
import { CkbIndexer } from "./indexer";
import { CKBIndexerTransactionCollector } from "./transaction_collector";

/** CellCollector will not get cell with blockHash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get blockHash if you need. */
export const CellCollector = CKBCellCollector;

/** CkbIndexer.collector will not get cell with blockHash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get blockHash if you need. */
export const Indexer = CkbIndexer;

export const TransactionCollector = CKBIndexerTransactionCollector;

export { RPC } from "./rpc";
