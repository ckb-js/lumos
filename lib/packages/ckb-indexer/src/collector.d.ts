import { Cell, BaseCellCollector } from "@ckb-lumos/base";
import { CKBIndexerQueryOptions, OtherQueryOptions } from "./type";
import { CkbIndexer } from "./indexer";
/** CellCollector will not get cell with blockHash by default, please use OtherQueryOptions.withBlockHash and OtherQueryOptions.CKBRpcUrl to get blockHash if you need. */
export declare class CKBCellCollector implements BaseCellCollector {
    indexer: CkbIndexer;
    queries: CKBIndexerQueryOptions;
    otherQueryOptions?: OtherQueryOptions | undefined;
    constructor(indexer: CkbIndexer, queries: CKBIndexerQueryOptions, otherQueryOptions?: OtherQueryOptions | undefined);
    validateQueryOption(queries: CKBIndexerQueryOptions): void;
    convertQueryOptionToSearchKey(): void;
    private getLiveCell;
    private shouldSkipped;
    count(): Promise<number>;
    private request;
    private getLiveCellWithBlockHash;
    /** collect cells without blockHash by default.if you need blockHash, please add OtherQueryOptions.withBlockHash and OtherQueryOptions.ckbRpcUrl when constructor CellCollect.
     * don't use OtherQueryOption if you don't need blockHash,cause it will slowly your collect.
     */
    collect(): AsyncGenerator<Cell, void, unknown>;
}
