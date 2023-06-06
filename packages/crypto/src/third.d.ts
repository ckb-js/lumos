declare module "browserify-aes" {
  interface Cipher {
    update(data: Uint8Array): Uint8Array;
    final(): Uint8Array;
  }

  export function createCipheriv(
    algorithm: string,
    key: Uint8Array,
    iv: Uint8Array
  ): Cipher;

  export function createDecipheriv(
    algorithm: string,
    key: Uint8Array,
    iv: Uint8Array
  ): Cipher;
}
