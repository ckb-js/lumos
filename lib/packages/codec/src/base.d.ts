export interface Codec<Packed, Unpacked, Packable = Unpacked, Unpackable = Packed> {
    pack: (packable: Packable) => Packed;
    unpack: (unpackable: Unpackable) => Unpacked;
}
export declare type AnyCodec = Codec<any, any>;
export declare type PackResult<T extends AnyCodec> = T extends Codec<infer Packed, infer Unpacked, infer Packable, infer Unpackable> ? Packed : never;
export declare type PackParam<T extends AnyCodec> = T extends Codec<infer Packed, infer Unpacked, infer Packable, infer Unpackable> ? Packable : never;
export declare type UnpackResult<T extends AnyCodec> = T extends Codec<infer Packed, infer Unpacked, infer Packable, infer Unpackable> ? Unpacked : never;
export declare type UnpackParam<T extends AnyCodec> = T extends Codec<infer Packed, infer Unpacked, infer Packable, infer Unpackable> ? Unpackable : never;
export declare type BytesCodec<Unpacked = any, Packable = Unpacked> = Codec<Uint8Array, Unpacked, Packable>;
export declare type BytesLike = ArrayLike<number> | ArrayBuffer | string;
export declare type BytesLikeCodec<Unpacked = any, Packable = Unpacked> = Codec<Uint8Array, Unpacked, Packable, BytesLike>;
/**
 * This function helps to create a codec that can
 * @param codec
 */
export declare function createBytesCodec<Unpacked, Packable = Unpacked>(codec: BytesCodec<Unpacked, Packable>): BytesLikeCodec<Unpacked, Packable>;
export declare type BaseHeader = {
    readonly __isFixedCodec__: true;
    readonly byteLength: number;
};
export declare type FixedBytesCodec<Unpacked = any, Packable = Unpacked> = BytesCodec<Unpacked, Packable> & BaseHeader;
export declare type FixedBytesLikeCodec<Unpacked = any, Packable = Unpacked> = BytesLikeCodec<Unpacked, Packable> & BaseHeader;
export declare function isFixedCodec<T>(codec: BytesCodec<T>): codec is FixedBytesCodec<T>;
export declare function createFixedBytesCodec<Unpacked, Packable = Unpacked>(codec: BytesCodec<Unpacked, Packable> & {
    byteLength: number;
}): FixedBytesLikeCodec<Unpacked, Packable>;
