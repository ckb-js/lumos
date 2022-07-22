import { AnyCodec, Codec, PackParam, PackResult, UnpackParam, UnpackResult } from "../base";
export interface NullableCodec<C extends AnyCodec = AnyCodec> extends AnyCodec {
    pack(packable?: PackParam<C>): PackResult<C>;
    unpack(unpackable?: UnpackParam<C>): UnpackResult<C>;
}
export declare function createNullableCodec<C extends AnyCodec = AnyCodec>(codec: C): NullableCodec<C>;
declare type ObjectCodecShape = Record<string, AnyCodec>;
export declare type ObjectCodec<Shape extends ObjectCodecShape = ObjectCodecShape> = Codec<{
    [key in keyof Shape]: PackResult<Shape[key]>;
}, {
    [key in keyof Shape]: UnpackResult<Shape[key]>;
}, {
    [key in keyof Shape]: PackParam<Shape[key]>;
}, {
    [key in keyof Shape]: UnpackParam<Shape[key]>;
}>;
/**
 * a high-order codec that helps to organise multiple codecs together into a single object
 * @param codecShape
 * @example
 * ```ts
 * const codec = createObjectCodec({
 *   r: Uint8,
 *   g: Uint8,
 *   b: Uint8,
 * });
 *
 * // { r: ArrayBuffer([0xff]), g: ArrayBuffer([0x00]), b: ArrayBuffer([0x00]) }
 * codec.pack({ r: 255, g: 0, b: 0 });
 * ```
 */
export declare function createObjectCodec<Shape extends ObjectCodecShape>(codecShape: Shape): ObjectCodec<Shape>;
export declare type ArrayCodec<C extends AnyCodec> = Codec<PackResult<C>[], UnpackResult<C>[], PackParam<C>[], UnpackParam<C>[]>;
export declare function createArrayCodec<C extends AnyCodec>(codec: C): ArrayCodec<C>;
/**
 * @param codec
 * @param afterCodecPack
 * @param beforeCodecUnpack
 */
export declare function enhancePack<C extends AnyCodec, Packed>(codec: C, afterCodecPack: (arg: PackResult<C>) => Packed, beforeCodecUnpack: (arg: Packed) => UnpackParam<C>): Codec<Packed, UnpackResult<C>, PackParam<C>>;
export {};
