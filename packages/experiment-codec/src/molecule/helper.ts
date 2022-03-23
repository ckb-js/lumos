import {
  assertBufferLength,
  assertMinBufferLength,
  concatBuffer,
} from "../utils";
import { BytesCodec, FixedBytesCodec } from "../base";
import { Uint32LE } from "../number";

/**
 * a helper function to create custom codec of `array SomeType [byte; n]`
 * @param codec
 */
export function byteArrayOf<Packed, Packable = Packed>(
  codec: BytesCodec<Packed, Packable> & { byteLength: number }
): FixedBytesCodec<Packed, Packable> {
  const byteLength = codec.byteLength;
  return {
    __isFixedCodec__: true,
    byteLength,
    pack: (packable) => {
      const buf = codec.pack(packable);
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
export function byteOf<T>(codec: BytesCodec<T>): FixedBytesCodec<T> {
  return byteArrayOf({ ...codec, byteLength: 1 });
}

/**
 * a helper function to create custom codec of `vector Bytes <byte>`
 * @param codec
 */
export function byteVecOf<T>(codec: BytesCodec<T>): BytesCodec<T> {
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
