import { TransactionSkeleton } from "@ckb-lumos/helpers"

export type Address = string
export type Config = any // TODO: define this type later
export type FullCell = any
export type CellProvider = any

/**
 * secp256k1_blake160_multisig script requires S, R, M, N and public key hashes
 * S must be zero now
 * and N equals to publicKeyHashes size
 * so only need to provide R, M and public key hashes
 */
export interface MultisigScript {
  /** first nth public keys must match, 1 byte */
  R: number,
  /** threshold, 1 byte */
  M: number,
  /** blake160 hashes of compressed public keys */
  publicKeyHashes: string[],
}

export type FromInfo = MultisigScript | Address
export type ToInfo = Address | number

// TODO: secp256k1Blake160 types
export declare const secp256k1Blake160: {
  /**
   * transfer capacity from secp256k1_blake160 script cells
   *
   * @param txSkeleton
   * @param fromAddress
   * @param toInfo address or outputIndex, can be any type of lock script and can left empty.
   * @param amount transfer CKB capacity in shannon, will be ignored if `toInfo` means outputIndex
   * @param options
   */
  transfer(
    txSkeleton: TransactionSkeleton,
    fromAddress: Address,
    toInfo: ToInfo,
    amount: bigint,
    options: {
      config: Config,
      requireToAddress: boolean,
    },
  ): Promise<TransactionSkeleton>,

  /**
   * pay fee by secp256k1_blake160 script cells
   *
   * @param txSkeleton
   * @param fromAddress
   * @param amount fee in shannon
   * @param options
   */
  payFee(
    txSkeleton: TransactionSkeleton,
    fromAddress: Address,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeleton>,

  /**
   * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
   *
   * @param txSkeleton
   * @param options
   */
  prepareSigningEntries(
    txSkeleton: TransactionSkeleton,
    options: {
      config: Config,
    },
  ): TransactionSkeleton,
}

export declare const secp256k1Blake160Multisig: {
  /**
   * transfer capacity from multisig script cells
   *
   * @param txSkeleton
   * @param fromInfo fromAddress or fromMultisigScript, if this address new to txSkeleton inputs, must use fromMultisigScript
   * @param toInfo address or output index, can be any type of lock script and can left empty.
   * @param amount transfer CKB capacity in shannon, will be ignored if `toInfo` means outputIndex
   * @param options
   */
  transfer(
    txSkeleton: TransactionSkeleton,
    fromInfo: FromInfo,
    toInfo, ToInfo,
    amount: bigint,
    options: {
      config: Config,
      requiredToAddress: boolean,
    },
  ): Promise<TransactionSkeleton>,

  /**
   * pay fee by multisig script cells
   *
   * @param txSkeleton
   * @param fromInfo
   * @param amount fee in shannon
   * @param options
   */
  payFee(
    txSkeleton: TransactionSkeleton,
    fromInfo: FromInfo,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeleton>,

  /**
   * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
   *
   * @param txSkeleton
   * @param options
   */
  prepareSigningEntries(
    txSkeleton: TransactionSkeleton,
    options: {
      config: Config,
    },
  ): TransactionSkeleton,

  /**
   *
   * @param params multisig script params
   * @returns serialized multisig script
   */
  serializeMultisigScript(params: MultisigScript): string,

  /**
   *
   * @param serializedMultisigScript
   * @returns lock script args
   */
  multisigArgs(serializedMultisigScript: string): string,
}

export declare const dao: {
  /**
   * deposit a cell to DAO
   *
   * @param txSkeleton
   * @param toAddress deposit cell lock address
   * @param amount capacity in shannon
   * @param options
   */
  deposit(
    txSkeleton: TransactionSkeleton,
    toAddress: Address,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeleton>,

  /**
   * list DAO cells,
   *
   * @param cellProvider
   * @param fromAddress
   * @param cellType "deposit" or "withdraw", can using "" to list all.
   * @param options
   */
  listDaoCells(
    cellProvider: CellProvider,
    fromAddress: Address,
    cellType: string,
    options: {
      config: Config,
    },
  ): Promise<List<FullCell>>,

  /**
   * withdraw an deposited DAO cell
   *
   * @param txSkeleton
   * @param fromInput deposited DAO cell
   * @param options
   */
  withdraw(
    txSkeleton: TransactionSkeleton,
    fromInput: FullCell,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeleton>,

  /**
   * Unlock a withdrew DAO cell
   *
   * @param txSkeleton
   * @param depositInput deposited DAO cell
   * @param withdrawInput withdrew DAO cell
   * @param toAddress
   * @param options
   */
  unlock(
    txSkeleton: TransactionSkeleton,
    depositInput: FullCell,
    withdrawInput: FullCell,
    toAddress: Address,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeleton>,
}
