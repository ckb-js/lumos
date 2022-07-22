import { TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { Address, Cell, HexString, PackedSince } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { FromInfo } from ".";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";
export declare const CellCollector: CellCollectorConstructor;
/**
 * Setup input cell infos, such as cell deps and witnesses.
 *
 * @param txSkeleton
 * @param inputCell
 * @param _fromInfo
 * @param options
 */
export declare function setupInputCell(txSkeleton: TransactionSkeletonType, inputCell: Cell, _fromInfo?: FromInfo, { config, defaultWitness, since, }?: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
}): Promise<TransactionSkeletonType>;
export declare function transfer(txSkeleton: TransactionSkeletonType, fromAddress: Address, toAddress: Address | null | undefined, amount: bigint, options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
}): Promise<TransactionSkeletonType>;
export declare function transfer(txSkeleton: TransactionSkeletonType, fromAddress: Address, toAddress: Address | null | undefined, amount: bigint, options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
}): Promise<[TransactionSkeletonType, bigint]>;
export declare function transferCompatible(txSkeleton: TransactionSkeletonType, fromAddress: Address, toAddress: Address | null | undefined, amount: BIish, options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
}): Promise<TransactionSkeletonType>;
export declare function transferCompatible(txSkeleton: TransactionSkeletonType, fromAddress: Address, toAddress: Address | null | undefined, amount: BIish, options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
}): Promise<[TransactionSkeletonType, BI]>;
/**
 * pay fee by secp256k1_blake160 script cells
 *
 * @param txSkeleton
 * @param fromAddress
 * @param amount fee in shannon
 * @param options
 */
export declare function payFee(txSkeleton: TransactionSkeletonType, fromAddress: Address, amount: BIish, { config }?: Options): Promise<TransactionSkeletonType>;
/**
 * Inject capacity from `fromAddress` to target output.
 *
 * @param txSkeleton
 * @param outputIndex
 * @param fromAddress
 * @param options
 */
export declare function injectCapacity(txSkeleton: TransactionSkeletonType, outputIndex: number, fromAddress: Address, { config }?: Options): Promise<TransactionSkeletonType>;
/**
 * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
 *
 * @param txSkeleton
 * @param options
 */
export declare function prepareSigningEntries(txSkeleton: TransactionSkeletonType, { config }?: Options): TransactionSkeletonType;
declare const _default: {
    transfer: typeof transfer;
    transferCompatible: typeof transferCompatible;
    payFee: typeof payFee;
    prepareSigningEntries: typeof prepareSigningEntries;
    injectCapacity: typeof injectCapacity;
    setupInputCell: typeof setupInputCell;
    CellCollector: CellCollectorConstructor;
};
export default _default;
