import { DataLoader, DebuggerData, ExecuteResult } from "./types";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
export declare function parseDebuggerMessage(message: string, debugMessage?: string): ExecuteResult;
export declare function parseDebuggerData(txSkeleton: TransactionSkeletonType, loader: DataLoader): DebuggerData;
