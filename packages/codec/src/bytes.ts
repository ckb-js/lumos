import { BytesLike } from "./base";
import { assertHexString } from "./utils";

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
  return Uint8Array.from(
    bytesLikes.flatMap((bytes) => Array.from(bytify(bytes)))
  );
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
