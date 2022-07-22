import { BytesCodec, FixedBytesCodec } from "../base";
/**
 * a helper function to create custom codec of `array SomeType [byte; n]`
 * @param codec
 */
export declare function byteArrayOf<Packed, Packable = Packed>(codec: BytesCodec<Packed, Packable> & {
    byteLength: number;
}): FixedBytesCodec<Packed, Packable>;
/**
 * a helper function to create custom codec of `byte`
 * @param codec
 */
export declare function byteOf<T>(codec: BytesCodec<T>): FixedBytesCodec<T>;
/**
 * a helper function to create custom codec of `vector Bytes <byte>`
 * @param codec
 */
export declare function byteVecOf<T>(codec: BytesCodec<T>): BytesCodec<T>;
