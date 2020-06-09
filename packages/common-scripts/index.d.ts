import { TransactionSkeleton } from "@ckb-lumos/types"

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

// TODO: secp256k1Blake160 types

export declare const secp256k1Blake160Multisig: {
  /**
   * transfer capacity from multisig script cells
   *
   * @param txSkeleton
   * @param fromAddress must be multisig script address, can left empty if fromInfo exists
   * @param fromInfo multisig parameters, required if this fromAddress is first used in this txSkeleton, can left empty if fromAddress exists
   * @param toAddress can be any type of lock script and can left empty
   * @param amount transfer CKB capacity in shannon
   * @param options
   */
  transfer(
    txSkeleton: TransactionSkeleton,
    fromAddress: Address | undefined,
    fromInfo: MultisigScript | undefined,
    toAddress: Address | undefined,
    amount: bigint,
    options: {
      config: Config,
      requiredToAddress: boolean,
    },
  ): TransactionSkeleton,

  /**
   * pay fee by multisig script cells
   *
   * @param txSkeleton
   * @param fromAddress
   * @param fromInfo
   * @param amount fee in shannon
   * @param options
   */
  payFee(
    txSkeleton: TransactionSkeleton,
    fromAddress: Address | undefined,
    fromInfo: MultisigScript | undefined,
    amount: bigint,
    options: {
      config: Config,
    },
  ): TransactionSkeleton,

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
