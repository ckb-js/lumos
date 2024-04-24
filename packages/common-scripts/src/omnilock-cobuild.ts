import { HexString } from "@ckb-lumos/base";
import { OmnilockWitnessLock } from "./omnilock";
import { bytes, PackParam } from "@ckb-lumos/codec";

/**
 * @example
 *
 * cobuild.sealTransaction(
 *   txSkeleton,
 *   [sealCobuildBlake2bFlow(secp256k1SignRecoverable(digest, privateKey))]
 * )
 * @see https://github.com/XuJiandong/omnilock/blob/91efc8ac0018e391e6d29c1cd41f69b16fa5d89d/c/cobuild.c#L480-L481
 * @param witnessLock
 */
export function sealCobuildBlake2bFlow(
  witnessLock: PackParam<typeof OmnilockWitnessLock>
): HexString {
  return bytes.hexify(
    bytes.concat(
      // the first byte of the cobuild signature is a flag to determine which message calculation flow should be applied
      // @see https://github.com/XuJiandong/omnilock/blob/91efc8ac0018e391e6d29c1cd41f69b16fa5d89d/c/cobuild.c#L90
      [0x00],
      OmnilockWitnessLock.pack(witnessLock)
    )
  );
}
