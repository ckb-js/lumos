import {
  assertBufferLength,
  assertMinBufferLength,
  assertUint32,
  concatBuffer,
} from "./utils";

export interface Codec<Packed, Unpacked> {
  pack: (unpacked: Unpacked) => Packed;
  unpack: (packed: Packed) => Unpacked;
}

export type Pack<T extends Codec<any, any>> = ReturnType<T["pack"]>;
export type Unpack<T extends Codec<any, any>> = ReturnType<T["unpack"]>;

export interface BinaryCodec<Unpacked = any>
  extends Codec<ArrayBuffer, Unpacked> {}

export type Fixed = {
  readonly __isFixedCodec__: true;
  readonly byteLength: number;
};
export type FixedBinaryCodec<Unpacked = any> = BinaryCodec<Unpacked> & Fixed;

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

/**
 * a helper function to create custom codec of `array SomeType [byte; n]`
 * @param codec
 * @param byteLength
 */
export function byteArrayOf<T>(
  codec: BinaryCodec<T>,
  byteLength: number
): FixedBinaryCodec<T> {
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
  return byteArrayOf(codec, 1);
}

/**
 * Uint32 codec
 */
export const Uint32LE = byteArrayOf<number>(
  {
    pack: (num) => {
      assertUint32(num);
      const buffer = new ArrayBuffer(4);
      const view = new DataView(buffer);
      view.setUint32(0, num, true);
      return buffer;
    },
    unpack: (buf) => {
      const view = new DataView(buf);
      return view.getUint32(0, true);
    },
  },
  4
);

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
