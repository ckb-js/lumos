import { TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { HexString, Address, Cell, PackedSince } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { FromInfo, serializeMultisigScript, multisigArgs } from "./from_info";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";
export { serializeMultisigScript, multisigArgs };
export declare const CellCollector: CellCollectorConstructor;
/**
 * Setup input cell infos, such as cell deps and witnesses.
 *
 * @param txSkeleton
 * @param inputCell
 * @param fromInfo
 * @param options
 */
export declare function setupInputCell(txSkeleton: TransactionSkeletonType, inputCell: Cell, fromInfo?: FromInfo, { config, defaultWitness, since, requireMultisigScript, }?: Options & {
    defaultWitness?: HexString;
    requireMultisigScript?: boolean;
    since?: PackedSince;
}): Promise<TransactionSkeletonType>;
export declare function transfer(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, toAddress: Address | undefined, amount: bigint, options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
}): Promise<TransactionSkeletonType>;
export declare function transfer(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, toAddress: Address | undefined, amount: bigint, options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
}): Promise<[TransactionSkeletonType, bigint]>;
export declare function transferCompatible(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, toAddress: Address | undefined, amount: BIish, options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
}): Promise<TransactionSkeletonType>;
export declare function transferCompatible(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, toAddress: Address | undefined, amount: BIish, options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
}): Promise<[TransactionSkeletonType, BI]>;
/**
 * pay fee by multisig script cells
 *
 * @param txSkeleton
 * @param fromInfo
 * @param amount fee in shannon
 * @param options
 */
export declare function payFee(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, amount: BIish, { config }?: Options): Promise<TransactionSkeletonType>;
/**
 * Inject capacity from `fromInfo` to target output.
 *
 * @param txSkeleton
 * @param outputIndex
 * @param fromInfo
 * @param options
 */
export declare function injectCapacity(txSkeleton: TransactionSkeletonType, outputIndex: number, fromInfo: FromInfo, { config }?: Options): Promise<TransactionSkeletonType>;
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
    serializeMultisigScript: typeof serializeMultisigScript;
    multisigArgs: typeof multisigArgs;
    injectCapacity: typeof injectCapacity;
    setupInputCell: typeof setupInputCell;
    CellCollector: CellCollectorConstructor;
};
export default _default;
