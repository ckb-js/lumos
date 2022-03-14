import { BI } from "@ckb-lumos/bi";
import { BinaryCodec, FixedBinaryCodec } from "./layout";
import {
  assertBI,
  assertBufferLength,
  assertHexDecimal,
  assertHexString,
  assertMinBufferLength,
  assertUint16,
  assertUint32,
  assertUint8,
  concatBuffer,
  serializeJson,
  toArrayBuffer,
} from "./utils";

// byte
export const Uint8: FixedBinaryCodec<number> = {
  __isFixedCodec__: true,
  byteLength: 1,
  pack(u8) {
    assertUint8(u8);
    const buf = new ArrayBuffer(1);
    new DataView(buf).setUint8(0, u8);
    return buf;
  },
  unpack(buf) {
    assertBufferLength(buf, 1);
    return new DataView(buf).getUint8(0);
  },
};

export const HexUint8: FixedBinaryCodec<string> = {
  __isFixedCodec__: true,
  byteLength: 1,
  pack(str) {
    assertHexDecimal(str, 1);
    return Uint8.pack(parseInt(str, 16));
  },
  unpack(buf) {
    assertBufferLength(buf, 1);
    return `0x${Uint8.unpack(buf).toString(16)}`;
  },
};

// array Uint16 [byte; 2]
export const Uint16LE: FixedBinaryCodec<number> = {
  __isFixedCodec__: true,
  byteLength: 2,
  pack(u16) {
    assertUint16(u16);
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, u16, true);
    return buf;
  },
  unpack(buf) {
    assertBufferLength(buf, 2);
    return new DataView(buf).getUint16(0, true);
  },
};
/**
 * @alias Uint16LE
 */
export const Uint16 = Uint16LE;
export const Uint16BE: FixedBinaryCodec<number> = {
  __isFixedCodec__: true,
  byteLength: 2,
  pack(u16) {
    assertUint16(u16);
    const buf = new ArrayBuffer(2);
    new DataView(buf).setUint16(0, u16);
    return buf;
  },
  unpack(buf) {
    assertBufferLength(buf, 2);
    return new DataView(buf).getUint16(0);
  },
};

export const HexUint16LE: FixedBinaryCodec<string> = {
  __isFixedCodec__: true,
  byteLength: 2,
  pack(str) {
    assertHexDecimal(str, 2);
    return Uint16LE.pack(parseInt(str, 16));
  },
  unpack(buf) {
    assertBufferLength(buf, 2);
    return `0x${Uint16LE.unpack(buf).toString(16)}`;
  },
};
/**
 * @alias HexUint16LE
 */
export const HexUint16 = HexUint16LE;

export const HexUint16BE: FixedBinaryCodec<string> = {
  __isFixedCodec__: true,
  byteLength: 2,
  pack(str) {
    assertHexDecimal(str, 2);
    return Uint16BE.pack(parseInt(str, 16));
  },
  unpack(buf) {
    assertBufferLength(buf, 2);
    return `0x${Uint16BE.unpack(buf).toString(16)}`;
  },
};

// TODO UintNLE and UintNBE
// array Uint32 [byte; 4]
export const Uint32LE: FixedBinaryCodec<number> = {
  __isFixedCodec__: true,
  byteLength: 4,
  pack(num: number) {
    assertUint32(num);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num, true);
    return buffer;
  },
  unpack(buf) {
    assertBufferLength(buf, 4);
    const view = new DataView(buf);
    return view.getUint32(0, true);
  },
};
/**
 * @alias Uint32LE
 */
export const Uint32 = Uint32LE;
export const Uint32BE: FixedBinaryCodec<number> = {
  __isFixedCodec__: true,
  byteLength: 4,
  pack(num: number) {
    assertUint32(num);
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setUint32(0, num);
    return buffer;
  },
  unpack(buf) {
    assertBufferLength(buf, 4);
    const view = new DataView(buf);
    return view.getUint32(0);
  },
};

export const HexUint32LE: FixedBinaryCodec<string> = {
  __isFixedCodec__: true,
  byteLength: 4,
  pack(numStr: string) {
    assertHexDecimal(numStr, 4);
    const num = BI.from(numStr).toNumber();
    return Uint32LE.pack(num);
  },
  unpack(buf) {
    assertBufferLength(buf, 4);
    return BI.from(Uint32LE.unpack(buf)).toHexString();
  },
};
/**
 * @alias HexUint32LE
 */
export const HexUint32 = HexUint32LE;
export const HexUint32BE: FixedBinaryCodec<string> = {
  __isFixedCodec__: true,
  byteLength: 4,
  pack(numStr: string) {
    assertHexDecimal(numStr, 4);
    const num = BI.from(numStr).toNumber();
    return Uint32BE.pack(num);
  },
  unpack(buf) {
    assertBufferLength(buf, 4);
    return BI.from(Uint32BE.unpack(buf)).toHexString();
  },
};

// array Uint64 [byte; 8]
export const Uint64LE: FixedBinaryCodec<BI> = createBICodec(8);
export const Uint64BE: FixedBinaryCodec<BI> = createBICodec(8, true);
/**
 * @alias Uint64LE
 */
export const Uint64 = Uint64LE;
export const HexUint64LE: FixedBinaryCodec<string> = createBIHexCodec(Uint64LE);
export const HexUint64BE: FixedBinaryCodec<string> = createBIHexCodec(Uint64BE);
/**
 * @alias HexUint64LE
 */
export const HexUint64 = HexUint64LE;

// array Uint128 [byte; 16]
export const Uint128LE: FixedBinaryCodec<BI> = createBICodec(16);
export const Uint128BE: FixedBinaryCodec<BI> = createBICodec(16, true);
/**
 * @alias Uint128LE
 */
export const Uint128 = Uint128LE;
export const HexUint128LE: FixedBinaryCodec<string> = createBIHexCodec(
  Uint128LE
);
export const HexUint128BE: FixedBinaryCodec<string> = createBIHexCodec(
  Uint128BE
);
/**
 * @alias HexUint128LE
 */
export const HexUint128 = HexUint128LE;

// array Uint256 [byte; 32]
export const Uint256LE: FixedBinaryCodec<BI> = createBICodec(32);
export const Uint256BE: FixedBinaryCodec<BI> = createBICodec(32, true);
/**
 * @alias Uint256LE
 */
export const Uint256 = Uint256LE;
export const HexUint256LE: FixedBinaryCodec<string> = createBIHexCodec(
  Uint256LE
);
export const HexUint256BE: FixedBinaryCodec<string> = createBIHexCodec(
  Uint256BE
);
/**
 * @alias HexUint256LE
 */
export const HexUint256 = HexUint256LE;

// array Uint512 [byte; 64]
export const Uint512LE: FixedBinaryCodec<BI> = createBICodec(64);
export const Uint512BE: FixedBinaryCodec<BI> = createBICodec(64, true);
/**
 * @alias Uint512LE
 */
export const Uint512 = Uint512LE;
export const HexUint512LE: FixedBinaryCodec<string> = createBIHexCodec(
  Uint512LE
);
export const HexUint512BE: FixedBinaryCodec<string> = createBIHexCodec(
  Uint512BE
);
/**
 * @alias HexUint512LE
 */
export const HexUint512 = HexUint512LE;

// array BytesN [byte; n]
export function fixedHexBytes(byteLength: number): FixedBinaryCodec<string> {
  return {
    __isFixedCodec__: true,
    byteLength,
    pack(hexStr: string) {
      assertHexString(hexStr, byteLength);
      return toArrayBuffer(hexStr);
    },
    unpack(buf) {
      assertBufferLength(buf, byteLength);
      return serializeJson(buf);
    },
  };
}

// vector Bytes <byte>
export const HexBytes: BinaryCodec<string> = {
  pack(hexStr: string) {
    assertHexString(hexStr);
    const body = toArrayBuffer(hexStr);
    const header = Uint32LE.pack(body.byteLength);
    return concatBuffer(header, body);
  },
  unpack(buf) {
    assertMinBufferLength(buf, 4);
    const header = Uint32LE.unpack(buf.slice(0, 4));
    assertBufferLength(buf, header + 4);
    return serializeJson(buf.slice(4, 4 + header));
  },
};
export const UTF8String: BinaryCodec<string> = {
  pack(hexStr: string) {
    assertHexString(hexStr);
    const result = toArrayBuffer(hexStr);
    return result;
  },
  unpack(buf) {
    return serializeJson(buf);
  },
};

export function createBICodec(
  byteLength: number,
  bigEndian?: boolean
): FixedBinaryCodec<BI> {
  const loops = Math.ceil(byteLength / 4);
  return {
    __isFixedCodec__: true,
    byteLength,
    pack(num: BI) {
      assertBI(num, byteLength);
      const buffer = new ArrayBuffer(byteLength);
      const view = new DataView(buffer);
      if (!bigEndian) {
        for (let i = 0; i < loops; i++) {
          view.setUint32(i * 4, num.and("0xffffffff").toNumber(), true);
          num = num.shr(32);
        }
      } else {
        for (let i = loops - 1; i >= 0; i--) {
          view.setUint32(i * 4, num.and("0xffffffff").toNumber());
          num = num.shr(32);
        }
      }
      return buffer;
    },
    unpack(buf) {
      assertBufferLength(buf, byteLength);
      const view = new DataView(buf);
      let num = BI.from(0);
      if (!bigEndian) {
        for (let i = 0; i < loops; i++) {
          const part = BI.from(view.getUint32(i * 4, true));
          num = num.or(part.shl(32 * i));
        }
      } else {
        for (let i = 0; i < loops; i++) {
          const part = BI.from(view.getUint32((loops - i - 1) * 4));
          num = num.or(part.shl(32 * i));
        }
      }
      return num;
    },
  };
}
export function createBIHexCodec(
  itemCodec: FixedBinaryCodec<BI>
): FixedBinaryCodec<string> {
  return {
    __isFixedCodec__: true,
    byteLength: itemCodec.byteLength,
    pack(numStr: string) {
      assertHexDecimal(numStr, itemCodec.byteLength);
      const num = BI.from(numStr);
      return itemCodec.pack(num);
    },
    unpack(buf) {
      assertBufferLength(buf, itemCodec.byteLength);
      return BI.from(itemCodec.unpack(buf)).toHexString();
    },
  };
}

export function createByteCodec<T>(byteCodec: BinaryCodec<T>): BinaryCodec<T> {
  return byteCodec;
}
