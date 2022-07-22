import { TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { FromInfo } from "./from_info";
import { Config } from "@ckb-lumos/config-manager";
import { Address, Header, Cell, HexString, Hash, PackedSince, Transaction } from "@ckb-lumos/base";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";
/**
 * CellCollector should be a class which implement CellCollectorInterface.
 * If you want to work well with `transfer`, `injectCapacity`, `payFee`, `payFeeByFeeRate`,
 *  please add the `output` at the end of `txSkeleton.get("outputs")`
 */
export interface LockScriptInfo {
    codeHash: Hash;
    hashType: "type" | "data";
    lockScriptInfo: {
        CellCollector: CellCollectorConstructor;
        setupInputCell(txSkeleton: TransactionSkeletonType, inputCell: Cell, fromInfo?: FromInfo, options?: {
            config?: Config;
            defaultWitness?: HexString;
            since?: PackedSince;
        }): Promise<TransactionSkeletonType>;
        prepareSigningEntries(txSkeleton: TransactionSkeletonType, options: Options): TransactionSkeletonType;
        setupOutputCell?: (txSkeleton: TransactionSkeletonType, outputCell: Cell, options: Options) => Promise<TransactionSkeletonType>;
    };
}
declare type LockScriptInfosType = {
    configHashCode: number;
    _predefinedInfos: LockScriptInfo[];
    _customInfos: LockScriptInfo[];
    infos: LockScriptInfo[];
};
declare function resetLockScriptInfos(): void;
declare function getLockScriptInfos(): LockScriptInfosType;
export declare function registerCustomLockScriptInfos(infos: LockScriptInfo[]): void;
declare function generateLockScriptInfos({ config }?: Options): void;
/**
 *
 * @param txSkeleton
 * @param fromInfos
 * @param toAddress
 * @param changeAddress
 * @param amount
 * @param tipHeader will not use locktime cells if tipHeader not provided
 * @param options
 */
export declare function transfer(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], toAddress: Address, amount: BIish, changeAddress?: Address, tipHeader?: Header, { config, useLocktimeCellsFirst, LocktimePoolCellCollector, }?: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    LocktimePoolCellCollector?: CellCollectorConstructor;
}): Promise<TransactionSkeletonType>;
export declare function injectCapacity(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], amount: BIish, changeAddress?: Address, tipHeader?: Header, { config, useLocktimeCellsFirst, LocktimePoolCellCollector, enableDeductCapacity, }?: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    LocktimePoolCellCollector?: CellCollectorConstructor;
    enableDeductCapacity?: boolean;
}): Promise<TransactionSkeletonType>;
export declare function payFee(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], amount: BIish, tipHeader?: Header, { config, useLocktimeCellsFirst, enableDeductCapacity, }?: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    enableDeductCapacity?: boolean;
}): Promise<TransactionSkeletonType>;
export declare function prepareSigningEntries(txSkeleton: TransactionSkeletonType, { config }?: Options): TransactionSkeletonType;
declare function _commonTransfer(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], amount: bigint, minimalChangeCapacity: bigint, { config, enableDeductCapacity, }?: Options & {
    enableDeductCapacity?: boolean;
}): Promise<{
    txSkeleton: TransactionSkeletonType;
    capacity: bigint;
    changeCapacity: bigint;
}>;
/**
 * A function to transfer input to output, and add input & output to txSkeleton.
 * And it will deal with cell deps and witnesses too. (Add the input required cell deps and witnesses.)
 * It should be noted that the output must be added to the end of txSkeleton.get("outputs").
 *
 * @param txSkeleton
 * @param inputCell
 * @param fromInfo
 * @param options
 */
export declare function setupInputCell(txSkeleton: TransactionSkeletonType, inputCell: Cell, fromInfo?: FromInfo, { config, since, defaultWitness, }?: Options & {
    since?: PackedSince;
    defaultWitness?: HexString;
}): Promise<TransactionSkeletonType>;
export declare function payFeeByFeeRate(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], feeRate: BIish, tipHeader?: Header, { config, useLocktimeCellsFirst, enableDeductCapacity, }?: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    enableDeductCapacity?: boolean;
}): Promise<TransactionSkeletonType>;
declare function calculateFee(size: number, feeRate: bigint): bigint;
declare function calculateFeeCompatible(size: number, feeRate: BIish): BI;
declare function getTransactionSize(txSkeleton: TransactionSkeletonType): number;
declare function getTransactionSizeByTx(tx: Transaction): number;
declare const _default: {
    transfer: typeof transfer;
    payFee: typeof payFee;
    prepareSigningEntries: typeof prepareSigningEntries;
    injectCapacity: typeof injectCapacity;
    setupInputCell: typeof setupInputCell;
    registerCustomLockScriptInfos: typeof registerCustomLockScriptInfos;
    payFeeByFeeRate: typeof payFeeByFeeRate;
    __tests__: {
        _commonTransfer: typeof _commonTransfer;
        resetLockScriptInfos: typeof resetLockScriptInfos;
        getLockScriptInfos: typeof getLockScriptInfos;
        generateLockScriptInfos: typeof generateLockScriptInfos;
        getTransactionSizeByTx: typeof getTransactionSizeByTx;
        getTransactionSize: typeof getTransactionSize;
        calculateFee: typeof calculateFee;
        calculateFeeCompatible: typeof calculateFeeCompatible;
    };
};
export default _default;
