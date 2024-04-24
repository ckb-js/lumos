// https://github.com/XuJiandong/omnilock/blob/fd6674d8d4a257cd378d0cc2fef60d362d85878a/tests/omni_lock_rust/src/blake2b.rs
import { bytes, BytesLike } from "@ckb-lumos/codec";
import blake2b from "blake2b";

const PERSONALIZATION_SIGHASH_ALL = "ckb-tcob-sighash";

const PERSONALIZATION_SIGHASH_ALL_ONLY = "ckb-tcob-sgohash";

// const PERSONALIZATION_OTX = "ckb-tcob-otxhash";

/**
 * create a Blake2b hash for the `SighashAll` CoBuild variant
 * @param value
 */
export function blake2bSighashAll(value: BytesLike): Uint8Array {
  return blake2b(
    32,
    undefined,
    undefined,
    new TextEncoder().encode(PERSONALIZATION_SIGHASH_ALL)
  )
    .update(bytes.bytify(value))
    .digest();
}

/**
 * create a Blake2b hash for the `SighashAllOnly` CoBuild variant
 * @param value
 */
export function blake2bSighashAllOnly(value: BytesLike): Uint8Array {
  return blake2b(
    32,
    undefined,
    undefined,
    new TextEncoder().encode(PERSONALIZATION_SIGHASH_ALL_ONLY)
  )
    .update(bytes.bytify(value))
    .digest();
}
