import { IndexerCollector } from "./collector";
import { CkbIndexer } from "./indexer";

export const Indexer = CkbIndexer;
export const CellCollector = IndexerCollector;
module.exports = {
  Indexer: CkbIndexer,
  CellCollector: IndexerCollector,
  // TransactionCollector,
};
