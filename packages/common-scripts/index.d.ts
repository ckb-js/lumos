import { TransactionSkeleton } from "@ckb-lumos/types"

// TODO: secp256k1Blake160 types

export declare const secp256k1Blake160Multisig: {
  /**
   * transfer capacity from multisig script cells
   *
   * @param txSkeleton
   * @param fromAddress must be multisig script address
   * @param fromInfo multisig parameters
   * @param toAddress can be any type of lock script and can left empty
   * @param amount transfer CKB capacity in shannon
   * @param options
   */
  transfer(
    txSkeleton: TransactionSkeleton,
    fromAddress: string,
    fromInfo: {
      R: number,
      M: number,
      publicKeyHashes: string[],
    },
    toAddress: string | undefined,
    amount: string | bigint,
    options: {
      config: any, // TODO: define this type later
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
    fromAddress: string,
    fromInfo: {
      R: number,
      M: number,
      publicKeyHashes: string[],
    },
    amount: string | bigint,
    options: {
      config: any
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
      config: any,
    },
  ): TransactionSkeleton,

  /**
   *
   * @param params multisig script params
   * @returns serialized multisig script
   */
  serializeMultisigScript(params: {
    R: number,
    M: number,
    publicKeyHashes: string[],
  }): string,

  /**
   *
   * @param serializedMultisigScript
   * @returns lock script args
   */
  multisigArgs(serializedMultisigScript: string): string,
}
