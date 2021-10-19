import { Script, Cell } from "@ckb-lumos/base";
import { CkbIndexer, SearchKey } from "./indexer";
export declare abstract class Collector {
    abstract getCellsByLockscriptAndCapacity(lockscript: Script, capacity: bigint): Promise<Cell[]>;
}
export declare class IndexerCollector extends Collector {
    indexer: CkbIndexer;
    constructor(indexer: CkbIndexer);
    getCellsByLockscriptAndCapacity(lockscript: Script, needCapacity: bigint): Promise<Cell[]>;
    collectSudtByAmount(searchKey: SearchKey, amount: bigint): Promise<Cell[]>;
    getBalance(lock: Script): Promise<bigint>;
    getSUDTBalance(sudtType: Script, userLock: Script): Promise<bigint>;
    getCellsByLockscriptAndCapacityWhenBurn(lockscript: Script, recipientTypeCodeHash: string, needCapacity: bigint): Promise<Cell[]>;
}
