import { Options, TransactionSkeletonType } from "@ckb-lumos/helpers";
import { FromInfo } from "./from_info";
import { PackedSince, Cell, Hash, HexString, Address, Header, SinceValidationInfo } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";
export interface LocktimeCell extends Cell {
    since: PackedSince;
    depositBlockHash?: Hash;
    withdrawBlockHash?: Hash;
    sinceValidationInfo?: SinceValidationInfo;
}
export declare const CellCollector: CellCollectorConstructor;
export declare function transfer(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], toAddress: Address | undefined, amount: bigint, tipHeader: Header, { config, requireToAddress, assertAmountEnough, LocktimeCellCollector, }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
    LocktimeCellCollector?: CellCollectorConstructor;
}): Promise<TransactionSkeletonType>;
export declare function transfer(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], toAddress: Address | undefined, amount: bigint, tipHeader: Header, { config, requireToAddress, assertAmountEnough, LocktimeCellCollector, }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
    LocktimeCellCollector?: CellCollectorConstructor;
}): Promise<[TransactionSkeletonType, bigint]>;
export declare function transferCompatible(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], toAddress: Address | undefined, amount: BIish, tipHeader: Header, { config, requireToAddress, assertAmountEnough, LocktimeCellCollector, }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
    LocktimeCellCollector?: CellCollectorConstructor;
}): Promise<TransactionSkeletonType>;
export declare function transferCompatible(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], toAddress: Address | undefined, amount: BIish, tipHeader: Header, { config, requireToAddress, assertAmountEnough, LocktimeCellCollector, }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
    LocktimeCellCollector?: CellCollectorConstructor;
}): Promise<[TransactionSkeletonType, BI]>;
declare function injectCapacityWithoutChangeCompatible(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], amount: BIish, tipHeader: Header, minimalChangeCapacity: BIish, { config, LocktimeCellCollector, enableDeductCapacity, }: {
    config?: Config;
    LocktimeCellCollector?: CellCollectorConstructor;
    enableDeductCapacity?: boolean;
}): Promise<{
    txSkeleton: TransactionSkeletonType;
    capacity: BI;
    changeCapacity: BI;
}>;
declare function injectCapacityWithoutChange(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], amount: bigint, tipHeader: Header, minimalChangeCapacity: bigint, { config, LocktimeCellCollector, enableDeductCapacity, }: {
    config?: Config;
    LocktimeCellCollector?: CellCollectorConstructor;
    enableDeductCapacity?: boolean;
}): Promise<{
    txSkeleton: TransactionSkeletonType;
    capacity: bigint;
    changeCapacity: bigint;
}>;
export declare function payFee(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], amount: BIish, tipHeader: Header, { config, LocktimeCellCollector, }?: {
    config?: Config;
    LocktimeCellCollector?: CellCollectorConstructor;
}): Promise<TransactionSkeletonType>;
export declare function prepareSigningEntries(txSkeleton: TransactionSkeletonType, { config }?: Options): TransactionSkeletonType;
export declare function injectCapacity(txSkeleton: TransactionSkeletonType, outputIndex: number, fromInfos: FromInfo[], tipHeader: Header, { config, LocktimeCellCollector, }?: Options & {
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
    LocktimeCellCollector?: CellCollectorConstructor;
}): Promise<TransactionSkeletonType>;
export declare function setupInputCell(txSkeleton: TransactionSkeletonType, inputCell: Cell, fromInfo?: FromInfo, { config, since, defaultWitness, }?: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
}): Promise<TransactionSkeletonType>;
declare const _default: {
    CellCollector: CellCollectorConstructor;
    transfer: typeof transfer;
    transferCompatible: typeof transferCompatible;
    payFee: typeof payFee;
    prepareSigningEntries: typeof prepareSigningEntries;
    injectCapacity: typeof injectCapacity;
    setupInputCell: typeof setupInputCell;
    injectCapacityWithoutChange: typeof injectCapacityWithoutChange;
    injectCapacityWithoutChangeCompatible: typeof injectCapacityWithoutChangeCompatible;
};
export default _default;
