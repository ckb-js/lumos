import { BytesLike } from "./base";
export declare function bytifyRawString(rawString: string): Uint8Array;
/**
 * convert a {@link BytesLike} to an Uint8Array
 * @param bytesLike
 */
export declare function bytify(bytesLike: BytesLike): Uint8Array;
/**
 * convert a {@link BytesLike} to an even length hex string prefixed with "0x"
 * @param buf
 * @example
 * hexify([0,1,2,3]) // "0x010203"
 * hexify(Buffer.from([1, 2, 3])) // "0x010203"
 */
export declare function hexify(buf: BytesLike): string;
export declare function concat(...bytesLikes: BytesLike[]): Uint8Array;
