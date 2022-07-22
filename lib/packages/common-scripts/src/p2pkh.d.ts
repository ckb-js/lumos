import { Hash, Script } from "@ckb-lumos/base";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
export interface Hasher {
    update(message: Uint8Array): void;
    digest(): Uint8Array;
}
declare type Group = {
    index: number;
    lock: Script;
    message: Hash;
};
declare type ThunkOrValue<T> = T | (() => T);
interface Options {
    hasher?: ThunkOrValue<Hasher>;
}
/**
 * Return an array of messages as well as their corresponding position indexes and locks for signing a P2PKH transaction.
 * For more details, please see:
 * https://github.com/nervosnetwork/ckb-system-scripts/wiki/How-to-sign-transaction
 *
 * @param tx TxSkeleton with all input cells' witnessArgs.lock filled with 0.
 * @param locks Locks you want to sign, e.g. you don't need to sign ACP cells.
 * @param hasher Message hasher, defaults to CKB blake2b hasher. Check
 * https://github.com/nervosnetwork/ckb-system-scripts/blob/e975e8b7d5231fdb1c537b830dd934b305492417/c/secp256k1_blake160_sighash_all.c#L22-L28 for more.
 * @returns An array of Group containing: lock of the input cell you need to sign, message for signing, witness index of this message (first index of the input cell with this lock).
 */
export declare function createP2PKHMessageGroup(tx: TransactionSkeletonType, locks: Script[], { hasher: thunkableHasher }?: Options): Group[];
export {};
