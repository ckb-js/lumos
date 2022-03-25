/* eslint-disable @typescript-eslint/no-explicit-any */
import { assertBufferLength, isObjectLike, toArrayBuffer } from "./utils";

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
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Packed
  : never;
export type PackParam<T extends AnyCodec> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Packable
  : never;
// prettier-ignore
export type UnpackResult<T extends AnyCodec> = T extends Codec<infer Packed,
        infer Unpacked,
        infer Packable,
        infer Unpackable>
    ? Unpacked
    : never;
export type UnpackParam<T extends AnyCodec> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Unpackable
  : never;

export type BytesCodec<Unpacked = any, Packable = Unpacked> = Codec<
  ArrayBuffer,
  Unpacked,
  Packable
>;

export type BytesLike = ArrayLike<number> | ArrayBuffer | string;

export type BytesLikeCodec<Unpacked = any, Packable = Unpacked> = Codec<
  ArrayBuffer,
  Unpacked,
  Packable,
  BytesLike
>;

/**
 * This function helps to create a codec that can
 * @param codec
 */
export function createBytesCodec<Unpacked, Packable = Unpacked>(
  codec: BytesCodec<Unpacked, Packable>
): BytesLikeCodec<Unpacked, Packable> {
  return {
    pack: (unpacked) => codec.pack(unpacked),
    unpack: (bytesLike) => codec.unpack(toArrayBuffer(bytesLike)),
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

export type FixedBytesLikeCodec<
  Unpacked = any,
  Packable = Unpacked
> = BytesLikeCodec<Unpacked, Packable> & Fixed;

export function isFixedCodec<T>(
  codec: BytesCodec<T>
): codec is FixedBytesCodec<T> {
  return isObjectLike(codec) && !!codec.__isFixedCodec__;
}

export function createFixedBytesCodec<Unpacked, Packable = Unpacked>(
  codec: BytesCodec<Unpacked, Packable> & { byteLength: number }
): FixedBytesLikeCodec<Unpacked, Packable> {
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

export function unimplemented(message = "unimplemented"): never {
  throw new Error(message);
}

/**
 * placeholder codec, generally used as a placeholder
 */
export const Unknown: BytesCodec<unknown> = {
  pack: () => unimplemented("Unimplemented pack"),
  unpack: () => unimplemented("Unimplemented unpack"),
};
