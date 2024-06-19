import { BytesLike } from "./base";
import { assertHexString, assertUtf8String } from "./utils";

export function bytifyRawString(rawString: string): Uint8Array {
  assertUtf8String(rawString);

  const buffer = new ArrayBuffer(rawString.length);
  const view = new DataView(buffer);

  for (let i = 0; i < rawString.length; i++) {
    const c = rawString.charCodeAt(i);
    view.setUint8(i, c);
  }
  return new Uint8Array(buffer);
}

const HEX_TO_NUMBER_CACHE: Record<string, number> = {
  "0": 0x0,
  "1": 0x1,
  "2": 0x2,
  "3": 0x3,
  "4": 0x4,
  "5": 0x5,
  "6": 0x6,
  "7": 0x7,
  "8": 0x8,
  "9": 0x9,

  a: 0xa,
  b: 0xb,
  c: 0xc,
  d: 0xd,
  e: 0xe,
  f: 0xf,

  A: 0xa,
  B: 0xb,
  C: 0xc,
  D: 0xd,
  E: 0xe,
  F: 0xf,
};

// a hex unit consists of two characters, such as 01, aa, 13
const HEX_UNIT_LEN = 2;

function bytifyHex(hex: string): Uint8Array {
  assertHexString(hex);

  const u8a = Uint8Array.from({ length: hex.length / HEX_UNIT_LEN - 1 });

  // starts with 2 since the first 2 char is the 0x prefix
  for (let i = 2, j = 0; i < hex.length; i = i + HEX_UNIT_LEN, j++) {
    const c1 = hex[i];
    const c2 = hex[i + 1];

    const n1 = HEX_TO_NUMBER_CACHE[c1];
    const n2 = HEX_TO_NUMBER_CACHE[c2];

    // 0xab -> 1byte -> 8bits -> 4bits ++ 4bits
    // the 1st 4 bits is the left hex char, and the 2nd 4 bits is the right hex char
    const FIRST_FOUR_BITS_OFFSET = 4;
    u8a[j] = (n1 << FIRST_FOUR_BITS_OFFSET) | n2;
  }

  return u8a;
}

const MIN_U8 = 0;
const MAX_U8 = 255;

function bytifyArrayLike(xs: ArrayLike<number>): Uint8Array {
  for (let i = 0; i < xs.length; i++) {
    const v = xs[i];
    if (v < MIN_U8 || v > MAX_U8 || !Number.isInteger(v)) {
      throw new Error("invalid ArrayLike, all elements must be 0-255");
    }
  }

  return Uint8Array.from(xs);
}

/**
 * convert a {@link BytesLike} to an Uint8Array
 * @param bytesLike
 */
export function bytify(bytesLike: BytesLike): Uint8Array {
  if (bytesLike instanceof ArrayBuffer) return new Uint8Array(bytesLike);
  if (bytesLike instanceof Uint8Array) return Uint8Array.from(bytesLike);
  if (typeof bytesLike === "string") return bytifyHex(bytesLike);
  if (Array.isArray(bytesLike)) return bytifyArrayLike(bytesLike);

  throw new Error(`Cannot convert ${bytesLike}`);
}

export function equal(a: BytesLike, b: BytesLike): boolean {
  const aUint8Array = bytify(a);
  const bUint8Array = bytify(b);
  return equalUint8Array(aUint8Array, bUint8Array);
}

function equalUint8Array(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = a.length; -1 < i; i -= 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const NUMBER_TO_HEX_CACHE = Array.from({ length: 256 }).map((_, i) =>
  i.toString(16).padStart(HEX_UNIT_LEN, "0")
);
/**
 * convert a {@link BytesLike} to an even length hex string prefixed with "0x"
 * @param buf
 * @example
 * hexify([0,1,2,3]) // "0x010203"
 * hexify(Buffer.from([1, 2, 3])) // "0x010203"
 */
export function hexify(buf: BytesLike): string {
  let hex = "";

  const u8a = bytify(buf);
  for (let i = 0; i < u8a.length; i++) {
    hex += NUMBER_TO_HEX_CACHE[u8a[i]];
  }

  return "0x" + hex;
}

export function concat(...bytesLikes: BytesLike[]): Uint8Array {
  const unmerged = bytesLikes.map(bytify);
  const totalSize = unmerged.reduce((size, item) => size + item.length, 0);

  const merged = new Uint8Array(totalSize);

  let offset = 0;
  unmerged.forEach((item) => {
    merged.set(item, offset);
    offset += item.length;
  });

  return merged;
}

// export function split(bytes: BytesLike, points: number[]): Uint8Array[] {
//   const u8vec = bytify(bytes);
//   const result: Uint8Array[] = [];
//   let offset = 0;
//   for (const point of points) {
//     result.push(u8vec.slice(offset, offset + point));
//     offset += point;
//   }
//   result.push(u8vec.slice(offset));
//   return result;
// }

/**
 * similar to Array.prototype.indexOf,
 * return the first at which a given `search` can be found,
 * or -1 if not present
 * @param val
 * @param search
 */
export function indexOf(val: BytesLike, search: BytesLike): number {
  const value = bytify(val);
  const searchElement = bytify(search);

  if (searchElement.length > value.length) return -1;
  if (searchElement.length === 0) return 0;

  const next = buildNext(searchElement);

  let i = 0;
  let j = 0;
  while (i < value.length) {
    if (value[i] === searchElement[j]) {
      i++;
      j++;
      if (j === searchElement.length) {
        return i - j;
      }
    } else {
      if (j > 0) {
        j = next[j - 1];
      } else {
        i++;
      }
    }
  }

  return -1;
}

function buildNext(search: Uint8Array): Uint8Array {
  const next = new Uint8Array(search.length);
  let j = 0;
  for (let i = 1; i < search.length; i++) {
    while (j > 0 && search[i] !== search[j]) {
      j = next[j - 1];
    }
    if (search[i] === search[j]) {
      j++;
    }
    next[i] = j;
  }
  return next;
}
