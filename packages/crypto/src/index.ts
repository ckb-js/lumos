/**
 * Generates cryptographically secure random bytes.
 * @param size The number of random bytes to generate. The `size` must not be greater than 65536.
 * @returns A Uint8Array containing the random bytes.
 * @throws {RangeError} If `size` is greater than 65536.
 */
export function randomBytes(
  size: number
): Uint8Array & { toString(format?: "hex"): string } {
  const MAX_BYTES = 65536; // limit of Crypto.getRandomValues()
  if (size > MAX_BYTES) {
    throw new RangeError(`size must be less than or equal to ${MAX_BYTES}`);
  }

  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);

  Object.defineProperty(bytes, "toString", {
    value: (format?: "hex") => {
      return format === "hex"
        ? Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, "0"))
            .join("")
        : Uint8Array.prototype.toString.call(bytes);
    },
  });

  return bytes;
}
