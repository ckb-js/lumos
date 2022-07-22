import { TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { HexString, Address, CellProvider, Cell, PackedDao, CellCollector as CellCollectorInterface } from "@ckb-lumos/base";
import { FromInfo } from "./from_info";
import { BI, BIish } from "@ckb-lumos/bi";
import RPC from '@ckb-lumos/rpc';
export declare class CellCollector implements CellCollectorInterface {
    private cellCollector;
    private cellType;
    constructor(fromInfo: FromInfo, cellProvider: CellProvider, cellType: "all" | "deposit" | "withdraw", { config }?: Options);
    collect(): AsyncGenerator<Cell>;
}
/**
 * list DAO cells,
 *
 * @param cellProvider
 * @param fromAddress
 * @param cellType
 * @param options
 */
export declare function listDaoCells(cellProvider: CellProvider, fromAddress: Address, cellType: "all" | "deposit" | "withdraw", { config }?: Options): AsyncIterator<Cell>;
/**
 * deposit a cell to DAO
 *
 * @param txSkeleton
 * @param fromInfo
 * @param toAddress deposit cell lock address
 * @param amount capacity in shannon
 * @param options
 */
export declare function deposit(txSkeleton: TransactionSkeletonType, fromInfo: FromInfo, toAddress: Address, amount: BIish, { config }?: Options): Promise<TransactionSkeletonType>;
/**
 * withdraw an deposited DAO cell
 *
 * @param txSkeleton
 * @param fromInput deposited DAO cell
 * @param fromInfo
 * @param options
 */
declare function withdraw(txSkeleton: TransactionSkeletonType, fromInput: Cell, fromInfo?: FromInfo, { config }?: Options): Promise<TransactionSkeletonType>;
/**
 * Unlock a withdrew DAO cell
 *
 * @param txSkeleton
 * @param depositInput deposited DAO cell
 * @param withdrawInput withdrew DAO cell
 * @param toAddress
 * @param fromInfo
 * @param options
 */
export declare function unlock(txSkeleton: TransactionSkeletonType, depositInput: Cell, withdrawInput: Cell, toAddress: Address, fromInfo: FromInfo, { config, RpcClient, }?: Options & {
    RpcClient?: typeof RPC;
}): Promise<TransactionSkeletonType>;
/**
 * calculate a withdraw dao cell minimal unlock since
 *
 * @param depositBlockHeaderEpoch depositBlockHeader.epoch
 * @param withdrawBlockHeaderEpoch withdrawBlockHeader.epoch
 */
export declare function calculateDaoEarliestSince(depositBlockHeaderEpoch: HexString, withdrawBlockHeaderEpoch: HexString): bigint;
/**
 * calculate a withdraw dao cell minimal unlock since
 *
 * @param depositBlockHeaderEpoch depositBlockHeader.epoch
 * @param withdrawBlockHeaderEpoch withdrawBlockHeader.epoch
 */
export declare function calculateDaoEarliestSinceCompatible(depositBlockHeaderEpoch: HexString, withdrawBlockHeaderEpoch: HexString): BI;
/**
 * calculate maximum withdraw capacity when unlock
 *
 * @param withdrawCell withdrawCell or depositCell
 * @param depositDao depositBlockHeader.dao
 * @param withdrawDao withdrawBlockHeader.dao
 */
export declare function calculateMaximumWithdraw(withdrawCell: Cell, depositDao: PackedDao, withdrawDao: PackedDao): bigint;
/**
 * calculate maximum withdraw capacity when unlock
 *
 * @param withdrawCell withdrawCell or depositCell
 * @param depositDao depositBlockHeader.dao
 * @param withdrawDao withdrawBlockHeader.dao
 */
export declare function calculateMaximumWithdrawCompatible(withdrawCell: Cell, depositDao: PackedDao, withdrawDao: PackedDao): BI;
declare const _default: {
    deposit: typeof deposit;
    withdraw: typeof withdraw;
    unlock: typeof unlock;
    calculateMaximumWithdraw: typeof calculateMaximumWithdraw;
    calculateMaximumWithdrawCompatible: typeof calculateMaximumWithdrawCompatible;
    calculateDaoEarliestSince: typeof calculateDaoEarliestSince;
    calculateDaoEarliestSinceCompatible: typeof calculateDaoEarliestSinceCompatible;
    CellCollector: typeof CellCollector;
    listDaoCells: typeof listDaoCells;
};
export default _default;
