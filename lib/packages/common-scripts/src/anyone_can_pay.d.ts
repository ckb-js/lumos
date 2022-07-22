import { Address, Cell, HexString, PackedSince } from "@ckb-lumos/base";
import { Options, TransactionSkeletonType } from "@ckb-lumos/helpers";
import { BIish } from "@ckb-lumos/bi";
import { FromInfo } from "./from_info";
import { CellCollectorConstructor, CellCollectorType } from "./type";
export declare const CellCollector: CellCollectorConstructor;
export declare function setupInputCell(txSkeleton: TransactionSkeletonType, inputCell: Cell, _fromInfo?: FromInfo, { config, defaultWitness, since, }?: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
}): Promise<TransactionSkeletonType>;
export declare function checkLimit(acpArgs: HexString, capacity: BIish): void;
export declare function setupOutputCell(txSkeleton: TransactionSkeletonType, outputCell: Cell, { config }?: Options): Promise<TransactionSkeletonType>;
export declare function injectCapacity(cellCollector: CellCollectorType, txSkeleton: TransactionSkeletonType, outputIndex: number, capacity: BIish, { config }?: Options): Promise<TransactionSkeletonType>;
export declare function prepareSigningEntries(txSkeleton: TransactionSkeletonType, { config }?: Options): TransactionSkeletonType;
export declare function withdraw(txSkeleton: TransactionSkeletonType, fromInput: Cell, toAddress: Address, capacity: BIish, { config }?: Options): Promise<TransactionSkeletonType>;
declare const _default: {
    CellCollector: CellCollectorConstructor;
    setupInputCell: typeof setupInputCell;
    setupOutputCell: typeof setupOutputCell;
    injectCapacity: typeof injectCapacity;
    prepareSigningEntries: typeof prepareSigningEntries;
    withdraw: typeof withdraw;
};
export default _default;
