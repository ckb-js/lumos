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

const CHAR_0 = "0".charCodeAt(0); // 48
const CHAR_9 = "9".charCodeAt(0); // 57
const CHAR_A = "A".charCodeAt(0); // 65
const CHAR_F = "F".charCodeAt(0); // 70
const CHAR_a = "a".charCodeAt(0); // 97
// const CHAR_f = "f".charCodeAt(0); // 102

function bytifyHex(hex: string): Uint8Array {
  assertHexString(hex);

  const u8a = Uint8Array.from({ length: hex.length / 2 - 1 });

  for (let i = 2, j = 0; i < hex.length; i = i + 2, j++) {
    const c1 = hex.charCodeAt(i);
    const c2 = hex.charCodeAt(i + 1);

    // prettier-ignore
    const n1 = c1 <= CHAR_9 ? c1 - CHAR_0 : c1 <= CHAR_F ? c1 - CHAR_A + 10 : c1 - CHAR_a + 10
    // prettier-ignore
    const n2 = c2 <= CHAR_9 ? c2 - CHAR_0 : c2 <= CHAR_F ? c2 - CHAR_A + 10 : c2 - CHAR_a + 10

    u8a[j] = (n1 << 4) | n2;
  }

  return u8a;
}

function bytifyArrayLike(xs: ArrayLike<number>): Uint8Array {
  for (let i = 0; i < xs.length; i++) {
    const v = xs[i];
    if (v < 0 || v > 255 || !Number.isInteger(v)) {
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

const HEX_CACHE = Array.from({ length: 256 }).map((_, i) =>
  i.toString(16).padStart(2, "0")
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
    hex += HEX_CACHE[u8a[i]];
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
