import {
  assertBufferLength,
  assertMinBufferLength,
  concatBuffer,
} from "../utils";
import { BinaryCodec, FixedBinaryCodec } from "../base";
import { Uint32LE } from "../number";

/**
 * a helper function to create custom codec of `array SomeType [byte; n]`
 * @param codec
 */
export function byteArrayOf<T>(
  codec: BinaryCodec<T> & { byteLength: number }
): FixedBinaryCodec<T> {
  const byteLength = codec.byteLength;
  return {
    __isFixedCodec__: true,
    byteLength,
    pack: (unpacked) => {
      const buf = codec.pack(unpacked);
      assertBufferLength(buf, byteLength);
      return buf;
    },
    unpack: (buf) => {
      assertBufferLength(buf, byteLength);
      return codec.unpack(buf);
    },
  };
}

/**
 * a helper function to create custom codec of `byte`
 * @param codec
 */
export function byteOf<T>(codec: BinaryCodec<T>): FixedBinaryCodec<T> {
  return byteArrayOf({ ...codec, byteLength: 1 });
}

/**
 * a helper function to create custom codec of `vector Bytes <byte>`
 * @param codec
 */
export function byteVecOf<T>(codec: BinaryCodec<T>): BinaryCodec<T> {
  return {
    pack(unpacked) {
      const payload = codec.pack(unpacked);
      const header = Uint32LE.pack(payload.byteLength);

      return concatBuffer(header, payload);
    },
    unpack(packed) {
      assertMinBufferLength(packed, 4);
      const header = Uint32LE.unpack(packed.slice(0, 4));
      assertBufferLength(packed.slice(4), header);
      return codec.unpack(packed.slice(4));
    },
  };
}
