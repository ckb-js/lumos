import { BI } from "@ckb-lumos/bi";
import { BinaryCodec, Codec, FixedBinaryCodec } from "./layout";

// byte
export declare const Uint8: FixedBinaryCodec<number>;
export declare const HexUint8: FixedBinaryCodec<string>;

// array Uint16 [byte; 2]
export declare const Uint16LE: FixedBinaryCodec<number>;
export declare const HexUint16LE: FixedBinaryCodec<string>;

// array Uint32 [byte; 4]
export declare const Uint32LE: FixedBinaryCodec<number>;
export declare const HexUint32LE: FixedBinaryCodec<string>;

// array Uint64 [byte; 8]
export declare const Uint64LE: FixedBinaryCodec<BI>;
export declare const HexUint64LE: FixedBinaryCodec<string>;

// array Uint128 [byte; 16]
export declare const Uint128LE: FixedBinaryCodec<BI>;
export declare const HexUint128LE: FixedBinaryCodec<string>;

// array Uint256 [byte; 32]
export declare const Uint256LE: FixedBinaryCodec<BI>;
export declare const HexUint256LE: FixedBinaryCodec<string>;

// array Uint512 [byte; 64]
export declare const Uint512LE: FixedBinaryCodec<BI>;
export declare const HexUint512LE: FixedBinaryCodec<string>;

// array BytesN [byte; n]
export declare function fixedHexBytes(
  byteLength: number
): FixedBinaryCodec<string>;

// vector Bytes <byte>
export declare const HexBytes: BinaryCodec<string>;
export declare const UTF8String: BinaryCodec<string>;

// byte
export declare const byte: FixedBinaryCodec<number>;
export declare function createByteCodec(): FixedBinaryCodec<number>;
export declare function createByteCodec<T>(
  byteCodec: Codec<number, T>
): FixedBinaryCodec<T>;
