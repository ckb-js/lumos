import { FixedBinaryCodec, Unknown } from "../base";
import {
  assertBufferLength,
  assertHexString,
  serializeJson,
  toArrayBuffer,
} from "../utils";
import { option, vector } from "./layout";
import { byteVecOf } from "./helper";

export function createFixedHexBytesCodec(
  byteLength: number
): FixedBinaryCodec<string> {
  return {
    __isFixedCodec__: true,
    byteLength,
    pack(hexStr: string) {
      assertHexString(hexStr, byteLength);
      return toArrayBuffer(hexStr);
    },
    unpack(buf) {
      assertBufferLength(buf, byteLength);
      return serializeJson(buf);
    },
  };
}

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
  unpack: (buf) => serializeJson(buf),
});

export const BytesOpt = option(Bytes);
export const BytesVec = vector(Bytes);
export const Byte32 = createFixedHexBytesCodec(32);
export const Byte32Vec = vector(Byte32);
