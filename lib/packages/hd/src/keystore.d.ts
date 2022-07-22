/// <reference types="node" />
import crypto from "crypto";
import { ExtendedPrivateKey } from "./extended_key";
import { HexString } from "@ckb-lumos/base";
export declare type HexStringWithoutPrefix = string;
export declare class UnsupportedCipher extends Error {
    constructor();
}
export declare class IncorrectPassword extends Error {
    constructor();
}
export declare class InvalidKeystore extends Error {
    constructor();
}
interface CipherParams {
    iv: HexStringWithoutPrefix;
}
interface KdfParams {
    dklen: number;
    n: number;
    r: number;
    p: number;
    salt: HexStringWithoutPrefix;
}
interface Crypto {
    cipher: string;
    cipherparams: CipherParams;
    ciphertext: HexStringWithoutPrefix;
    kdf: string;
    kdfparams: KdfParams;
    mac: HexStringWithoutPrefix;
}
export default class Keystore {
    crypto: Crypto;
    id: string;
    version: number;
    origin: string | undefined;
    constructor(theCrypto: Crypto, id: string, origin?: string);
    static fromJson(json: string): Keystore;
    /**
     * Load keystore file from path.
     *
     * @param path
     */
    static load(path: string): Keystore;
    /**
     * Keystore file default name is `${id}.json`.
     *
     * @param dir
     * @param options If you are sure to overwrite existing keystore file, set `overwrite` to true.
     */
    save(dir: string, { name, overwrite, }?: {
        name?: string;
        overwrite?: boolean;
    }): void;
    private filename;
    toJson(): string;
    isFromCkbCli(): boolean;
    static createEmpty(): Keystore;
    static create(extendedPrivateKey: ExtendedPrivateKey, password: string, options?: {
        salt?: Buffer;
        iv?: Buffer;
    }): Keystore;
    isEmpty(): boolean;
    decrypt(password: string): HexString;
    extendedPrivateKey(password: string): ExtendedPrivateKey;
    checkPassword(password: string): boolean;
    derivedKey(password: string): Buffer;
    static mac(derivedKey: Buffer, ciphertext: Buffer): HexStringWithoutPrefix;
    static scryptOptions(kdfparams: KdfParams): crypto.ScryptOptions;
}
export {};
