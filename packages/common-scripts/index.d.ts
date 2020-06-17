import { TransactionSkeleton } from "@ckb-lumos/helpers"
import { Cell, CellProvider } from "@ckb-lumos/types"

export type Address = string
export type Config = any // TODO: define this type later

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

// TODO: secp256k1Blake160 types
export declare const secp256k1Blake160: {
  /**
   * transfer capacity from secp256k1_blake160 script cells
   *
   * @param txSkeleton
   * @param fromAddress
   * @param toAddress
   * @param amount transfer CKB capacity in shannon.
   * @param options
   */
  transfer(
    txSkeleton: TransactionSkeleton,
    fromAddress: Address,
    toAddress: Address,
    amount: bigint,
    options: {
      config: Config,
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

  /**
   * Inject capacity from `fromAddress` to target output.
   *
   * @param txSkeleton
   * @param outputIndex
   * @param fromAddress
   * @param options
   */
  injectCapacity(
    txSkeleton: TransactionSkeleton,
    outputIndex: number,
    fromAddress: Address,
    options: {
      config: Config,
    },
  ): TransactionSkeleton,

  /**
   * Setup input cell infos, such as cell deps and witnesses.
   *
   * @param txSkeleton
   * @param inputIndex
   * @param options
   */
  setupInputCell(
    txSkeleton: TransactionSkeleton,
    inputIndex: number,
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
   * @param toAddress
   * @param amount transfer CKB capacity in shannon.
   * @param options
   */
  transfer(
    txSkeleton: TransactionSkeleton,
    fromInfo: FromInfo,
    toAddress: Address,
    amount: bigint,
    options: {
      config: Config,
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

    /**
   * Inject capacity from `fromInfo` to target output.
   *
   * @param txSkeleton
   * @param outputIndex
   * @param fromInfo
   * @param options
   */
  injectCapacity(
    txSkeleton: TransactionSkeleton,
    outputIndex: number,
    fromInfo: FromInfo,
    options: {
      config: Config,
    },
  ): TransactionSkeleton,

  /**
   * Setup input cell infos, such as cell deps and witnesses.
   *
   * @param txSkeleton
   * @param inputIndex
   * @param fromInfo
   * @param options
   */
  setupInputCell(
    txSkeleton: TransactionSkeleton,
    inputIndex: number,
    fromInfo: FromInfo | undefined,
    options: {
      config: Config,
    },
  ): TransactionSkeleton,
}

export declare const dao: {
  /**
   * deposit a cell to DAO
   *
   * @param txSkeleton
   * @param fromInfo
   * @param toAddress deposit cell lock address
   * @param amount capacity in shannon
   * @param options
   */
  deposit(
    txSkeleton: TransactionSkeleton,
    fromInfo: FromInfo,
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
   * @param cellType
   * @param options
   */
  listDaoCells(
    cellProvider: CellProvider,
    fromAddress: Address,
    cellType: "all" | "deposit" | "withdraw",
    options: {
      config: Config,
    },
  ): AsyncIterator<Cell>,

  /**
   * withdraw an deposited DAO cell
   *
   * @param txSkeleton
   * @param fromInput deposited DAO cell
   * @param fromInfo
   * @param options
   */
  withdraw(
    txSkeleton: TransactionSkeleton,
    fromInput: Cell,
    fromInfo: FromInfo | undefined,
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
   * @param fromInfo
   * @param options
   */
  unlock(
    txSkeleton: TransactionSkeleton,
    depositInput: Cell,
    withdrawInput: Cell,
    toAddress: Address,
    fromInfo: FromInfo,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeleton>,
}
