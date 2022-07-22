import { Address, Cell, CellDep, CellProvider, Hash, HexString, PackedSince, Script, Transaction } from "@ckb-lumos/base";
import { List, Map as ImmutableMap, Record } from "immutable";
import { Config } from "@ckb-lumos/config-manager";
import { BI } from "@ckb-lumos/bi";
export interface Options {
    config?: Config;
}
export declare function minimalCellCapacity(fullCell: Cell, { validate }?: {
    validate?: boolean;
}): bigint;
export declare function minimalCellCapacityCompatible(fullCell: Cell, { validate }?: {
    validate?: boolean;
}): BI;
export declare function locateCellDep(script: Script, { config }?: Options): CellDep | null;
/**
 * @deprecated please migrate to {@link encodeToAddress}, the short format address will be removed in the future
 * @param script
 * @param param1
 * @returns
 */
export declare function generateAddress(script: Script, { config }?: Options): Address;
/**
 * @deprecated please migrate to {@link encodeToAddress}, the short format address will be removed in the future */
export declare const scriptToAddress: typeof generateAddress;
export declare function generateSecp256k1Blake160Address(args: HexString, { config }?: Options): Address;
export declare function generateSecp256k1Blake160MultisigAddress(args: HexString, { config }?: Options): Address;
export declare function parseAddress(address: Address, { config }?: Options): Script;
export declare const addressToScript: typeof parseAddress;
export declare function encodeToAddress(script: Script, { config }?: Options): Address;
export interface TransactionSkeletonInterface {
    cellProvider: CellProvider | null;
    cellDeps: List<CellDep>;
    headerDeps: List<Hash>;
    inputs: List<Cell>;
    outputs: List<Cell>;
    witnesses: List<HexString>;
    fixedEntries: List<{
        field: string;
        index: number;
    }>;
    signingEntries: List<{
        type: string;
        index: number;
        message: string;
    }>;
    inputSinces: ImmutableMap<number, PackedSince>;
}
export declare type TransactionSkeletonType = Record<TransactionSkeletonInterface> & Readonly<TransactionSkeletonInterface>;
export declare const TransactionSkeleton: Record.Factory<TransactionSkeletonInterface>;
export declare function createTransactionFromSkeleton(txSkeleton: TransactionSkeletonType, { validate }?: {
    validate?: boolean;
}): Transaction;
export declare function sealTransaction(txSkeleton: TransactionSkeletonType, sealingContents: HexString[]): Transaction;
export interface TransactionSkeletonObject {
    cellProvider: CellProvider | null;
    cellDeps: CellDep[];
    headerDeps: Hash[];
    inputs: Cell[];
    outputs: Cell[];
    witnesses: HexString[];
    fixedEntries: Array<{
        field: string;
        index: number;
    }>;
    signingEntries: Array<{
        type: string;
        index: number;
        message: string;
    }>;
    inputSinces: Map<number, PackedSince>;
}
/**
 * Convert TransactionSkeleton to js object
 *
 * @param txSkelton
 */
export declare function transactionSkeletonToObject(txSkelton: TransactionSkeletonType): TransactionSkeletonObject;
/**
 * Convert js object to TransactionSkeleton
 *
 * @param obj
 */
export declare function objectToTransactionSkeleton(obj: TransactionSkeletonObject): TransactionSkeletonType;
