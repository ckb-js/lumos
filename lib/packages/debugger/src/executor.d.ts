import { DataLoader, ExecuteResult, Executor } from "./types";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { Hash } from "@ckb-lumos/base";
interface DebuggerOptions {
    readonly loader: DataLoader;
    readonly debuggerPath?: string;
}
export declare class CKBDebugger implements Executor {
    loader: DataLoader;
    debuggerPath: string;
    constructor(payload: DebuggerOptions);
    /**
     * save tx skeleton to tmp file and return the path
     * @param txSkeleton
     * @private
     */
    private saveTmpTxFile;
    execute(txSkeleton: TransactionSkeletonType, options: {
        scriptHash: Hash;
        scriptGroupType: "lock" | "type";
    }): Promise<ExecuteResult>;
}
export {};
