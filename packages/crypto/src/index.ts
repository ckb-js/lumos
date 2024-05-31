/**
 * Generates cryptographically secure random bytes.
 * @param size The number of random bytes to generate. The `size` must not be greater than 65536.
 * @returns A Uint8Array containing the random bytes.
 * @throws {RangeError} If `size` is greater than 65536.
 */
export function randomBytes(size: number): Uint8Array {
  const MAX_BYTES = 65536; // limit of Crypto.getRandomValues()
  if (size > MAX_BYTES) {
    throw new RangeError(`size must be less than or equal to ${MAX_BYTES}`);
  }

  const bytes = new Uint8Array(size);
  try {
    crypto.getRandomValues(bytes); // Node.js 20+ and modern browsers
  } catch {
    /* eslint-disable @typescript-eslint/no-var-requires */
    require("crypto").getRandomValues(bytes); // Node.js 18
  }

  return bytes;
}
