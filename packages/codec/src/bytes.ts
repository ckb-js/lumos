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

function bytifyHex(hex: string): Uint8Array {
  assertHexString(hex);

  hex = hex.slice(2);
  const uint8s = [];
  for (let i = 0; i < hex.length; i += 2) {
    uint8s.push(parseInt(hex.substr(i, 2), 16));
  }

  return Uint8Array.from(uint8s);
}

function bytifyArrayLike(xs: ArrayLike<number>): Uint8Array {
  const isValidU8Vec = Array.from(xs).every((v) => v >= 0 && v <= 255);
  if (!isValidU8Vec) {
    throw new Error("invalid ArrayLike, all elements must be 0-255");
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
  if (aUint8Array.length !== bUint8Array.length) return false;
  return equalUint8Array(aUint8Array, bUint8Array);
}

function equalUint8Array(a: Uint8Array, b: Uint8Array): boolean {
  for (let i = a.length; -1 < i; i -= 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
/**
 * convert a {@link BytesLike} to an even length hex string prefixed with "0x"
 * @param buf
 * @example
 * hexify([0,1,2,3]) // "0x010203"
 * hexify(Buffer.from([1, 2, 3])) // "0x010203"
 */
export function hexify(buf: BytesLike): string {
  const hex = Array.from(bytify(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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
