import { syncScrypt as _scryptSync, scrypt as _scrypt } from "scrypt-js";
import { ScryptOptions } from "./types";

function assertOptions(
  options: ScryptOptions
): asserts options is Required<ScryptOptions> {
  if (!options.r || !options.p || !options.N) {
    throw new Error(
      `Invalid scrypt options ${JSON.stringify(options)}, r, p, N are required`
    );
  }
}

export function scryptSync(
  password: Uint8Array,
  salt: Uint8Array,
  dkLen: number,
  options: ScryptOptions
): Uint8Array {
  assertOptions(options);
  return _scryptSync(password, salt, options.N, options.r, options.p, dkLen);
}

export function scrypt(
  password: Uint8Array,
  salt: Uint8Array,
  dkLen: number,
  options: ScryptOptions
): Promise<Uint8Array> {
  assertOptions(options);
  return _scrypt(password, salt, options.N, options.r, options.p, dkLen);
}
