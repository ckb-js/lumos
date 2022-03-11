import { BI } from "@ckb-lumos/bi";

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

function asserts(condition: unknown, message = "assertion failed!"): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertHexDecimal(str: string, byteLength?: number): void {
  if (byteLength) {
    const regex = RegExp(String.raw`^0x([0-9a-fA-F]){1,${byteLength * 2}}$`);
    if (!regex.test(str)) {
      throw new Error("Invalid hex decimal!");
    }
  } else {
    if (!/^0x([0-9a-fA-F])+$/.test(str)) {
      throw new Error("Invalid hex decimal!");
    }
  }
}

export function assertHexString(str: string, byteLength?: number) {
  if (byteLength) {
    const regex = RegExp(
      String.raw`^0x([0-9a-fA-F][0-9a-fA-F]){${byteLength}}$`
    );
    if (!regex.test(str)) {
      throw new Error("Invalid hex string!");
    }
  } else {
    if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(str)) {
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

export function assertUint8(num: number): void {
  if (num < 0 || num > 255) {
    throw new Error("Invalid Uint8!");
  }
}

export function assertUint16(num: number): void {
  asserts(num >= 0 && num <= 65532, `Invalid Uint16: ${num}`);
}

export function assertUint32(num: number): void {
  asserts(num >= 0 && num <= 0xffffffff, `Invalid Uint32: ${num}`);
}

export function assertBI(num: BI, byteLength: number): void {
  if (!num.and(`0x${"ff".repeat(byteLength)}`).eq(num)) {
    throw new Error(`Invalid BI with byteLength: ${byteLength}!`);
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

export function toArrayBuffer(
  s: string | ArrayBuffer | Uint8Array | ArrayLike<number>
): ArrayBuffer {
  if (s instanceof ArrayBuffer) return s;
  if (s instanceof Uint8Array) return Uint8Array.from(s).buffer;
  if (typeof s === "string") return hexToArrayBuffer(s);
  if (Array.isArray(s)) return bytesToArrayBuffer(s);

  throw new Error(`Cannot convert ${s} to ArrayBuffer`);
}

export function serializeJson(buf: ArrayBuffer): string {
  return (
    "0x" +
    Array.prototype.map
      .call(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}
