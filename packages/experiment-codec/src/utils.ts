import { BytesLike } from "./base";

export function concatBuffer(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce(
    (acc, buffer) => acc + buffer.byteLength,
    0
  );
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return result.buffer;
}

const HEX_DECIMAL_REGEX = /^0x([0-9a-fA-F])+$/;
const HEX_DECIMAL_WITH_BYTELENGTH_REGEX_MAP = new Map<number, RegExp>();
export function assertHexDecimal(str: string, byteLength?: number): void {
  if (byteLength) {
    let regex = HEX_DECIMAL_WITH_BYTELENGTH_REGEX_MAP.get(byteLength);
    if (!regex) {
      const newRegex = RegExp(
        String.raw`^0x([0-9a-fA-F]){1,${byteLength * 2}}$`
      );
      HEX_DECIMAL_WITH_BYTELENGTH_REGEX_MAP.set(byteLength, newRegex);
      regex = newRegex;
    }
    if (!regex.test(str)) {
      throw new Error("Invalid hex decimal!");
    }
  } else {
    if (!HEX_DECIMAL_REGEX.test(str)) {
      throw new Error("Invalid hex decimal!");
    }
  }
}

const HEX_STRING_REGEX = /^0x([0-9a-fA-F][0-9a-fA-F])*$/;
const HEX_STRING_WITH_BYTELENGTH_REGEX_MAP = new Map<number, RegExp>();
export function assertHexString(str: string, byteLength?: number): void {
  if (byteLength) {
    let regex = HEX_STRING_WITH_BYTELENGTH_REGEX_MAP.get(byteLength);
    if (!regex) {
      const newRegex = RegExp(
        String.raw`^0x([0-9a-fA-F][0-9a-fA-F]){${byteLength}}$`
      );
      HEX_STRING_WITH_BYTELENGTH_REGEX_MAP.set(byteLength, newRegex);
      regex = newRegex;
    }
    if (!regex.test(str)) {
      throw new Error("Invalid hex string!");
    }
  } else {
    if (!HEX_STRING_REGEX.test(str)) {
      throw new Error("Invalid hex string!");
    }
  }
}

export function assertBufferLength(buf: ArrayBuffer, length: number): void {
  if (buf.byteLength !== length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be ${length}`
    );
  }
}

export function assertMinBufferLength(buf: ArrayBuffer, length: number): void {
  if (buf.byteLength < length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be at least ${length}`
    );
  }
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  assertHexString(hex);
  const byteLength = hex.length / 2 - 1;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);
  for (let i = 0; i < byteLength; i++) {
    view.setUint8(i, parseInt(hex.slice(2 * i + 2, 2 * i + 4), 16));
  }
  return buffer;
}

export function bytesToArrayBuffer(xs: ArrayLike<number>): ArrayBuffer {
  return new Uint8Array(xs).buffer;
}

export function toArrayBuffer(s: BytesLike): ArrayBuffer {
  if (s instanceof ArrayBuffer) return s;
  if (s instanceof Uint8Array) return Uint8Array.from(s).buffer;
  if (typeof s === "string") return hexToArrayBuffer(s);
  if (Array.isArray(s)) return bytesToArrayBuffer(s);
  throw new Error(`Cannot convert ${s} to ArrayBuffer`);
}

export function toHex(buf: BytesLike): string {
  return (
    "0x" +
    Array.prototype.map
      .call(new Uint8Array(toArrayBuffer(buf)), (x) =>
        x.toString(16).padStart(2, "0")
      )
      .join("")
  );
}

export function isObjectLike(x: unknown): x is Record<string, unknown> {
  if (!x) return false;
  return typeof x === "object";
}
