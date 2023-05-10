/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertBufferLength, isObjectLike } from "./utils";
import { bytify } from "./bytes";

export interface Codec<
  Packed,
  Unpacked,
  Packable = Unpacked,
  Unpackable = Packed
> {
  pack: (packable: Packable) => Packed;
  unpack: (unpackable: Unpackable) => Unpacked;
}

export type AnyCodec = Codec<any, any>;

export type PackResult<T extends AnyCodec> = T extends Codec<
  infer Packed,
  any,
  any,
  any
>
  ? Packed
  : never;
export type PackParam<T extends AnyCodec> = T extends Codec<
  any,
  any,
  infer Packable,
  any
>
  ? Packable
  : never;

export type UnpackResult<T extends AnyCodec> = T extends Codec<
  any,
  infer Unpacked,
  any,
  any
>
  ? Unpacked
  : never;

export type UnpackParam<T extends AnyCodec> = T extends Codec<
  any,
  any,
  any,
  infer Unpackable
>
  ? Unpackable
  : never;

export type Uint8ArrayCodec<Unpacked = any, Packable = Unpacked> = Codec<
  Uint8Array,
  Unpacked,
  Packable
>;

export type BytesLike = ArrayLike<number> | ArrayBuffer | string;

export type BytesCodec<Unpacked = any, Packable = Unpacked> = Codec<
  Uint8Array,
  Unpacked,
  Packable,
  BytesLike
>;

/**
 * This function helps to create a codec that can
 * @param codec
 */
export function createBytesCodec<Unpacked, Packable = Unpacked>(
  codec: Uint8ArrayCodec<Unpacked, Packable>
): BytesCodec<Unpacked, Packable> {
  return {
    pack: (unpacked) => codec.pack(unpacked),
    unpack: (bytesLike) => codec.unpack(bytify(bytesLike)),
  };
}

export type Fixed = {
  readonly __isFixedCodec__: true;
  readonly byteLength: number;
};

export type FixedBytesCodec<Unpacked = any, Packable = Unpacked> = BytesCodec<
  Unpacked,
  Packable
> &
  Fixed;

export function isFixedCodec<T>(
  codec: BytesCodec<T>
): codec is FixedBytesCodec<T> {
  return isObjectLike(codec) && !!codec.__isFixedCodec__;
}

export function createFixedBytesCodec<Unpacked, Packable = Unpacked>(
  codec: Uint8ArrayCodec<Unpacked, Packable> & { byteLength: number }
): FixedBytesCodec<Unpacked, Packable> {
  const byteLength = codec.byteLength;
  return {
    __isFixedCodec__: true,
    byteLength,
    ...createBytesCodec({
      pack: (u) => {
        const packed = codec.pack(u);
        assertBufferLength(packed, byteLength);
        return packed;
      },
      unpack: (buf) => {
        assertBufferLength(buf, byteLength);
        return codec.unpack(buf);
      },
    }),
  };
}
