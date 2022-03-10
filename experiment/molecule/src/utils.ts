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

export function createBuffer(xs: number[]): ArrayBuffer {
  return new Uint8Array(xs).buffer;
}

export function assertHexDecimal(str: string, byteLength?: number) {
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

export function assertBufferLength(buf: ArrayBuffer, length: number) {
  if (buf.byteLength !== length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be ${length}`
    );
  }
}

export function assertUint8(num: number) {
  if (num < 0 || num > 255) {
    throw new Error("Invalid Uint8!");
  }
}

export function assertUint16(num: number) {
  if (num < 0 || num > 65535) {
    throw new Error("Invalid Uint16!");
  }
}

export function assertUint32(num: number) {
  if (num < 0 || num > 4294967295) {
    throw new Error("Invalid Uin32!");
  }
}

export function assertBI(num: BI, byteLength: number) {
  if (!num.and(`0x${"ff".repeat(byteLength)}`).eq(num)) {
    throw new Error(`Invalid BI with bytelength: ${byteLength}!`);
  }
}

export function toArrayBuffer(s: string) {
  const byteLength = s.length / 2 - 1;
  const buffer = new ArrayBuffer(byteLength);
  const view = new DataView(buffer);

  for (let i = 0; i < byteLength; i++) {
    view.setUint8(i, parseInt(s.slice(2 * i + 2, 2 * i + 4), 16));
  }
  return buffer;
}

export function serializeJson(buf: ArrayBuffer) {
  return (
    "0x" +
    Array.prototype.map
      .call(new Uint8Array(buf), (x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}
