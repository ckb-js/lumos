import {
  CodecBaseParseError,
  CodecExecuteError,
  isCodecExecuteError,
} from "./error";

const CHAR_0 = "0".charCodeAt(0); // 48
const CHAR_9 = "9".charCodeAt(0); // 57
const CHAR_A = "A".charCodeAt(0); // 65
const CHAR_F = "F".charCodeAt(0); // 70
const CHAR_a = "a".charCodeAt(0); // 97
const CHAR_f = "f".charCodeAt(0); // 102

function assertStartsWith0x(str: string): void {
  if (!str || !str.startsWith("0x")) {
    throw new Error("Invalid hex string");
  }
}

function assertHexChars(str: string): void {
  const strLen = str.length;

  for (let i = 2; i < strLen; i++) {
    const char = str[i].charCodeAt(0);
    if (
      (char >= CHAR_0 && char <= CHAR_9) ||
      (char >= CHAR_a && char <= CHAR_f) ||
      (char >= CHAR_A && char <= CHAR_F)
    ) {
      continue;
    }

    throw new Error(`Invalid hex character ${str[i]} in the string ${str}`);
  }
}

export function assertHexDecimal(str: string, byteLength?: number): void {
  assertStartsWith0x(str);
  if (str.length === 2) {
    throw new Error(
      "Invalid hex decimal length, should be at least 1 character, the '0x' is incorrect, should be '0x0'"
    );
  }

  const strLen = str.length;

  if (typeof byteLength === "number" && strLen > byteLength * 2 + 2) {
    throw new Error(
      `Invalid hex decimal length, should be less than ${byteLength} bytes, got ${
        strLen / 2 - 1
      } bytes`
    );
  }

  assertHexChars(str);
}

/**
 * Assert if a string is a valid hex string that is matched with /^0x([0-9a-fA-F][0-9a-fA-F])*$/
 * @param str
 * @param byteLength
 */
export function assertHexString(str: string, byteLength?: number): void {
  assertStartsWith0x(str);

  const strLen = str.length;

  if (strLen % 2) {
    throw new Error("Invalid hex string length, must be even!");
  }

  if (typeof byteLength === "number" && strLen !== byteLength * 2 + 2) {
    throw new Error("Invalid hex string length, not match with byteLength!");
  }

  assertHexChars(str);
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

export function trackCodeExecuteError<T>(
  path: string | number | symbol,
  fn: () => T
): T {
  try {
    return fn();
  } catch (e) {
    const readableError = isCodecExecuteError(e)
      ? e
      : new CodecExecuteError(e as CodecBaseParseError);
    readableError.updateKey(path);
    throw readableError;
  }
}
