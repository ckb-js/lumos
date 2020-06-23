import { TransactionSkeletonType } from "@ckb-lumos/helpers"
import { Cell, CellProvider, Script, Header, PackedSince, HexString, Hash, PackedDao } from "@ckb-lumos/base"

export type Address = string
export type Config = any // TODO: define this type later

export interface LocktimeCell {
  cell: Cell
  maximumCapacity: bigint
  since: PackedSince
  depositBlockHash?: Hash
  withdrawBlockHash?: Hash
  sinceBaseValue?: {
    epoch: HexString
    number: HexString
    timestamp: HexString
  }
}

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
  publicKeyHashes: Hash[],
  /** locktime in since format */
  since: PackedSince,
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
    txSkeleton: TransactionSkeletonType,
    fromAddress: Address,
    toAddress: Address,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

  /**
   * pay fee by secp256k1_blake160 script cells
   *
   * @param txSkeleton
   * @param fromAddress
   * @param amount fee in shannon
   * @param options
   */
  payFee(
    txSkeleton: TransactionSkeletonType,
    fromAddress: Address,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

  /**
   * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
   *
   * @param txSkeleton
   * @param options
   */
  prepareSigningEntries(
    txSkeleton: TransactionSkeletonType,
    options: {
      config: Config,
    },
  ): TransactionSkeletonType,

  /**
   * Inject capacity from `fromAddress` to target output.
   *
   * @param txSkeleton
   * @param outputIndex
   * @param fromAddress
   * @param options
   */
  injectCapacity(
    txSkeleton: TransactionSkeletonType,
    outputIndex: number,
    fromAddress: Address,
    options: {
      config: Config,
    },
  ): TransactionSkeletonType,

  /**
   * Setup input cell infos, such as cell deps and witnesses.
   *
   * @param txSkeleton
   * @param inputIndex
   * @param options
   */
  setupInputCell(
    txSkeleton: TransactionSkeletonType,
    inputIndex: number,
    options: {
      config: Config,
    },
  ): TransactionSkeletonType,
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
    txSkeleton: TransactionSkeletonType,
    fromInfo: FromInfo,
    toAddress: Address,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

  /**
   * pay fee by multisig script cells
   *
   * @param txSkeleton
   * @param fromInfo
   * @param amount fee in shannon
   * @param options
   */
  payFee(
    txSkeleton: TransactionSkeletonType,
    fromInfo: FromInfo,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

  /**
   * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
   *
   * @param txSkeleton
   * @param options
   */
  prepareSigningEntries(
    txSkeleton: TransactionSkeletonType,
    options: {
      config: Config,
    },
  ): TransactionSkeletonType,

  /**
   *
   * @param params multisig script params
   * @returns serialized multisig script
   */
  serializeMultisigScript(params: MultisigScript): HexString,

  /**
   *
   * @param serializedMultisigScript
   * @param since
   * @returns lock script args
   */
  multisigArgs(serializedMultisigScript: HexString, since?: PackedSince): HexString,

    /**
   * Inject capacity from `fromInfo` to target output.
   *
   * @param txSkeleton
   * @param outputIndex
   * @param fromInfo
   * @param options
   */
  injectCapacity(
    txSkeleton: TransactionSkeletonType,
    outputIndex: number,
    fromInfo: FromInfo,
    options: {
      config: Config,
    },
  ): TransactionSkeletonType,

  /**
   * Setup input cell infos, such as cell deps and witnesses.
   *
   * @param txSkeleton
   * @param inputIndex
   * @param fromInfo
   * @param options
   */
  setupInputCell(
    txSkeleton: TransactionSkeletonType,
    inputIndex: number,
    fromInfo?: FromInfo,
    options: {
      config: Config,
    },
  ): TransactionSkeletonType,
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
    txSkeleton: TransactionSkeletonType,
    fromInfo: FromInfo,
    toAddress: Address,
    amount: bigint,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

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
    txSkeleton: TransactionSkeletonType,
    fromInput: Cell,
    fromInfo: FromInfo | undefined,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

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
    txSkeleton: TransactionSkeletonType,
    depositInput: Cell,
    withdrawInput: Cell,
    toAddress: Address,
    fromInfo: FromInfo,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

  /**
   * calculate a withdraw dao cell minimal unlock since
   *
   * @param depositBlockHeaderEpoch depositBlockHeader.epoch
   * @param withdrawBlockHeaderEpoch withdrawBlockHeader.epoch
   */
  calculateUnlockSince(
    depositBlockHeaderEpoch: HexString,
    withdrawBlockHeaderEpoch: HexString,
  ): bigint,

  /**
   * calculate maximum withdraw capacity when unlock
   *
   * @param withdrawCell withdrawCell or depositCell
   * @param depositDao depositBlockHeader.dao
   * @param withdrawDao withdrawBlockHeader.dao
   */
  calculateMaximumWithdraw(
    withdrawCell: Cell,
    depositDao: PackedDao,
    withdrawDao: PackedDao,
  ): bigint,
}

export declare const locktimePool: {
  collectCells(
    cellProvider: CellProvider,
    fromScript: Script,
    options: {
      config: Config,
    },
  ): AsyncIterator<LocktimeCell>,

  transfer(
    txSkeleton: TransactionSkeletonType,
    fromInfos: FromInfo[],
    toAddress: Address,
    amount: bigint,
    tipHeader: Header,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,

  payFee(
    txSkeleton: TransactionSkeletonType,
    fromInfos: FromInfo[],
    amount: bigint,
    tipHeader: Header,
    options: {
      config: Config,
    },
  ): Promise<TransactionSkeletonType>,
}
