import { createFixedBytesCodec, FixedBytesCodec, Unknown } from "./base";
import { toArrayBuffer, toHex } from "./utils";
import { byteVecOf, option, vector } from "./molecule";

export const createFixedHexBytesCodec = (
  byteLength: number
): FixedBytesCodec<string> =>
  createFixedBytesCodec<string>({
    byteLength,
    pack: (hex) => toArrayBuffer(hex),
    unpack: (buf) => toHex(buf),
  });

/**
 * placeholder codec, generally used as a placeholder
 * ```
 * // for example, when some BytesOpt is not used, it will be filled with this codec
 * // option BytesOpt (Bytes);
 * const UnusedBytesOpt = UnknownOpt
 * ```
 */
export const UnusedOpt = option(Unknown);

// vector Bytes <byte>
export const Bytes = byteVecOf<string>({
  pack: (hex) => toArrayBuffer(hex),
  unpack: (buf) => toHex(buf),
});

export const BytesOpt = option(Bytes);
export const BytesVec = vector(Bytes);
export const Byte32 = createFixedHexBytesCodec(32);
export const Byte32Vec = vector(Byte32);
