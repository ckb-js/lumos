import { assertBufferLength, isObjectLike } from "./utils";

export interface Codec<
  Packed,
  Unpacked,
  Packable = Unpacked,
  Unpackable = Packed
> {
  pack: (unpacked: Packable) => Packed;
  unpack: (packed: Unpackable) => Unpacked;
}

export type Packed<T> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Packed
  : never;

export type Packable<T> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Packable
  : never;

/**
 * @example
 * ```ts
 * type UnpackedUint32 = Unpacked<typeof Uint32> // number
 * ```
 */
export type Unpacked<T> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Unpacked
  : never;

export type Unpackable<T> = T extends Codec<
  infer Packed,
  infer Unpacked,
  infer Packable,
  infer Unpackable
>
  ? Unpackable
  : never;

export type BinaryCodec<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Unpacked = any,
  Packable = Unpacked,
  Unpackable = ArrayBuffer
> = Codec<ArrayBuffer, Unpacked, Packable, Unpackable>;

export type Fixed = {
  readonly __isFixedCodec__: true;
  readonly byteLength: number;
};

export function isFixedCodec<T>(
  codec: BinaryCodec<T>
): codec is FixedBinaryCodec<T> {
  return isObjectLike(codec) && !!codec.__isFixedCodec__;
}

export type FixedBinaryCodec<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Unpacked = any,
  Packable = Unpacked,
  Unpackable = ArrayBuffer
> = BinaryCodec<Unpacked, Packable, Unpackable> & Fixed;

export function createFixedCodec<C extends BinaryCodec>(
  payload: C & { byteLength: number }
): FixedBinaryCodec<Unpacked<C>> {
  const byteLength = payload.byteLength;
  return {
    byteLength,
    __isFixedCodec__: true,
    pack: (u) => {
      const packed = payload.pack(u);
      assertBufferLength(packed, byteLength);
      return packed;
    },
    unpack: (buf) => {
      assertBufferLength(buf, byteLength);
      return payload.unpack(buf);
    },
  };
}

export function unimplemented(message = "unimplemented"): never {
  throw new Error(message);
}

/**
 * placeholder codec, generally used as a placeholder
 */
export const Unknown: BinaryCodec<unknown> = {
  pack: () => unimplemented("Unimplemented pack"),
  unpack: () => unimplemented("Unimplemented unpack"),
};
