import { Hash, Address, Header } from "@ckb-lumos/base";
import { FromInfo } from "./from_info";
import { TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { BIish } from "@ckb-lumos/bi";
export declare type Token = Hash;
/**
 * Issue an sUDT cell
 *
 * @param txSkeleton
 * @param fromInfo
 * @param amount
 * @param capacity
 * @param tipHeader
 * @param options
 */
export declare function issueToken(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, amount: BIish, capacity?: BIish, tipHeader?: Header, { config }?: Options): Promise<TransactionSkeletonType>;
/**
 *
 * @param txSkeleton
 * @param fromInfos
 * @param sudtToken
 * @param toAddress
 * @param amount
 * @param changeAddress if not provided, will use first fromInfo
 * @param capacity
 * @param tipHeader
 * @param options When `splitChangeCell = true` && change amount > 0 && change capacity >= minimalCellCapacity(change cell with sudt) + minimalCellCapacity(change cell without sudt), change cell will split to two change cells, one with sudt and one without.
 */
export declare function transfer(txSkeleton: TransactionSkeletonType, fromInfos: FromInfo[], sudtToken: Token, toAddress: Address, amount: BIish, changeAddress?: Address, capacity?: BIish, tipHeader?: Header, { config, LocktimePoolCellCollector, splitChangeCell, }?: Options & {
    LocktimePoolCellCollector?: any;
    splitChangeCell?: boolean;
}): Promise<TransactionSkeletonType>;
/**
 * Compute sudt token by owner from info.
 *
 * @param fromInfo
 * @param options
 */
export declare function ownerForSudt(fromInfo: FromInfo, { config }?: Options): Token;
declare const _default: {
    issueToken: typeof issueToken;
    transfer: typeof transfer;
    ownerForSudt: typeof ownerForSudt;
};
export default _default;
