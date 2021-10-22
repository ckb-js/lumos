import { Script, Cell, BaseCellCollector, QueryOptions } from "@ckb-lumos/base";
import { OrderedSet } from "immutable";
import { Order } from './indexer';
import { CkbIndexer, SearchKey } from "./indexer";
export declare abstract class Collector {
    abstract getCellsByLockscriptAndCapacity(lockscript: Script, capacity: bigint): Promise<Cell[]>;
}
export declare class IndexerCollector extends BaseCellCollector {
    indexer: CkbIndexer;
    queries: QueryOptions;
    lock: Script | undefined;
    type: string | Script | undefined;
    data: string;
    fromBlock: string | null;
    toBlock: string | null;
    order: Order;
    skip: number | null;
    argsLen: number | "any";
    constructor(indexer: CkbIndexer, queries: QueryOptions);
    getLiveCell(): Promise<OrderedSet<Cell> | null>;
    wrapOutPoints(outPoints: Cell[]): OrderedSet<Cell>;
    count(): Promise<number>;
    getCellsByLockscriptAndCapacity(lockscript: Script, needCapacity: bigint): Promise<Cell[]>;
    collectSudtByAmount(searchKey: SearchKey, amount: bigint): Promise<Cell[]>;
    getBalance(lock: Script): Promise<bigint>;
    getSUDTBalance(sudtType: Script, userLock: Script): Promise<bigint>;
    getCellsByLockscriptAndCapacityWhenBurn(lockscript: Script, recipientTypeCodeHash: string, needCapacity: bigint): Promise<Cell[]>;
}
