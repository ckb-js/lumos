import { BI, BIish } from "@ckb-lumos/bi";
import { arrayify, BytesLike } from "@ethersproject/bytes";
import { FixedBinaryCodec } from "../base";

function createUintNumberCodec(
  byteLength: number,
  littleEndian = false
): FixedBinaryCodec<number, BIish, BytesLike | ArrayBuffer> {
  const codec = createUintBICodec(byteLength, littleEndian);
  return {
    __isFixedCodec__: true,
    byteLength,
    pack: (packable) => codec.pack(packable),
    unpack: (unpackable) => codec.unpack(unpackable).toNumber(),
  };
}

function createUintBICodec(
  byteLength: number,
  littleEndian = false
): FixedBinaryCodec<BI, BIish, BytesLike | ArrayBuffer> {
  const max = BI.from(1)
    .shl(byteLength * 8)
    .sub(1);

  return {
    __isFixedCodec__: true,
    byteLength,
    pack(x) {
      let num = BI.from(x);

      if (num.lt(0) || num.gt(max)) {
        throw new Error(
          `value must be in range [0, ${max.toString()}], ${x} is out of range`
        );
      }

      const result = new DataView(new ArrayBuffer(byteLength));

      for (let i = 0; i < byteLength; i++) {
        if (littleEndian) {
          result.setUint8(i, num.and(0xff).toNumber());
        } else {
          result.setUint8(byteLength - i - 1, num.and(0xff).toNumber());
        }
        num = num.shr(8);
      }

      return result.buffer;
    },
    unpack(x) {
      const view = new DataView(
        x instanceof ArrayBuffer ? x : arrayify(x).buffer
      );
      if (view.byteLength !== byteLength) {
        throw new Error(
          `byte length must be ${byteLength}, but got ${view.byteLength}`
        );
      }

      let result = BI.from(0);

      for (let i = 0; i < byteLength; i++) {
        if (littleEndian) {
          result = result.or(BI.from(view.getUint8(i)).shl(i * 8));
        } else {
          result = result.shl(8).or(view.getUint8(i));
        }
      }

      return result;
    },
  };
}

export const Uint8 = createUintNumberCodec(1);

export const Uint16LE = createUintNumberCodec(2, true);
export const Uint16BE = createUintNumberCodec(2);
/**
 * @alias Uint16LE
 */
export const Uint16 = Uint16LE;

export const Uint32LE = createUintNumberCodec(4, true);
export const Uint32BE = createUintNumberCodec(4);
/**
 * @alias Uint32LE
 */
export const Uint32 = Uint32LE;

export const Uint64LE = createUintBICodec(8, true);
export const Uint64BE = createUintBICodec(8);
/**
 * @alias Uint64LE
 */
export const Uint64 = Uint64LE;

export const Uint128LE = createUintBICodec(16, true);
export const Uint128BE = createUintBICodec(16);
/**
 * @alias Uint128LE
 */
export const Uint128 = Uint128LE;

export const Uint256LE = createUintBICodec(32, true);
export const Uint256BE = createUintBICodec(32);
/**
 * @alias Uint256LE
 */
export const Uint256 = Uint256LE;

export const Uint512LE = createUintBICodec(64, true);
export const Uint512BE = createUintBICodec(64);
/**
 * @alias Uint512LE
 */
export const Uint512 = Uint512LE;
