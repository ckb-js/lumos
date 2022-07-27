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

export function assertUtf8String(str: string): void {
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c > 0xff) {
      throw new Error("Invalid UTF-8 raw string!");
    }
  }
}

export function assertBufferLength(
  buf: { byteLength: number },
  length: number
): void {
  if (buf.byteLength !== length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be ${length}`
    );
  }
}

export function assertMinBufferLength(
  buf: { byteLength: number },
  length: number
): void {
  if (buf.byteLength < length) {
    throw new Error(
      `Invalid buffer length: ${buf.byteLength}, should be at least ${length}`
    );
  }
}

export function isObjectLike(x: unknown): x is Record<string, unknown> {
  if (!x) return false;
  return typeof x === "object";
}
