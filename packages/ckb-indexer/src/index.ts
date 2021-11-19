import { CKBCellCollector } from "./collector";
import { CkbIndexer } from "./indexer";

/** CkbIndexer.collector will not get cell with block_hash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get block_hash if you need. */
export const Indexer = CkbIndexer;

/** CellCollector will not get cell with block_hash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get block_hash if you need. */
export const CellCollector = CKBCellCollector;
