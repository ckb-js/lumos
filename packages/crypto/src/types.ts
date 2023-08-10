export interface Hash {
  update(data: Uint8Array): Hash;
  digest(): Uint8Array;
}

export type HashAlgo = "sha512" | "sha256" | "ripemd160";

export type CreateHmac = (algorithm: HashAlgo, bytes: Uint8Array) => Hash;

export type ScryptOptions = {
  // cost factor
  N?: number;
  // block size
  r?: number;
  // parallelization
  p?: number;
};

export interface Cipher {
  update(data: Uint8Array): Uint8Array;
  final(): Uint8Array;
}
