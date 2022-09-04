import { BI, BIish } from "@ckb-lumos/bi";
import {
  createFixedBytesCodec,
  FixedBytesCodec,
  CodecBaseError,
} from "../base";

function assertNumberRange(
  value: BIish,
  min: BIish,
  max: BIish,
  typeName: string
): void {
  value = BI.from(value);

  if (value.lt(min) || value.gt(max)) {
    throw new CodecBaseError(
      `Value must be between ${min.toString()} and ${max.toString()}, but got ${value.toString()}`,
      typeName
    );
  }
}

function createUintNumberCodec(
  byteLength: number,
  littleEndian = false
): FixedBytesCodec<number, BIish> {
  const codec = createUintBICodec(byteLength, littleEndian);
  return {
    __isFixedCodec__: true,
    byteLength,
    pack: (packable) => codec.pack(packable),
    unpack: (unpackable) => codec.unpack(unpackable).toNumber(),
  };
}

const createUintBICodec = (byteLength: number, littleEndian = false) => {
  const max = BI.from(1)
    .shl(byteLength * 8)
    .sub(1);

  return createFixedBytesCodec<BI, BIish>({
    byteLength,
    pack(biIsh) {
      const typeName = `Uint${byteLength * 8}${littleEndian ? "LE" : "BE"}`;
      if (typeof biIsh === "number" && !Number.isSafeInteger(biIsh)) {
        throw new CodecBaseError(`${biIsh} is not a safe integer`, typeName);
      }

      let num = BI.from(biIsh);
      assertNumberRange(num, 0, max, typeName);

      const result = new DataView(new ArrayBuffer(byteLength));

      for (let i = 0; i < byteLength; i++) {
        if (littleEndian) {
          result.setUint8(i, num.and(0xff).toNumber());
        } else {
          result.setUint8(byteLength - i - 1, num.and(0xff).toNumber());
        }
        num = num.shr(8);
      }

      return new Uint8Array(result.buffer);
    },
    unpack: (buf) => {
      const view = new DataView(Uint8Array.from(buf).buffer);
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
  });
};

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
