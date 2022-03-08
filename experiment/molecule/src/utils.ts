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

export function assertHexString(str: string) {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(str)) {
    throw new Error("Invalid hex string!");
  }
}

export function toArrayBuffer(s: string) {
  const byteLength = (s.length / 2) - 1
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
      .call(new Uint8Array(buf), x => x.toString(16).padStart(2, '0'))
      .join("")
  );
}