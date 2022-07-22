/// <reference types="node" />
import { HexString } from "@ckb-lumos/base";
export declare function signRecoverable(message: HexString, privateKey: HexString): HexString;
export declare function recoverFromSignature(message: HexString, signature: HexString): HexString;
export declare function privateToPublic(privateKey: Buffer): Buffer;
export declare function privateToPublic(privateKey: HexString): HexString;
export declare function publicKeyToBlake160(publicKey: HexString): HexString;
export declare function privateKeyToBlake160(privateKey: HexString): HexString;
declare const _default: {
    signRecoverable: typeof signRecoverable;
    recoverFromSignature: typeof recoverFromSignature;
    privateToPublic: typeof privateToPublic;
    publicKeyToBlake160: typeof publicKeyToBlake160;
    privateKeyToBlake160: typeof privateKeyToBlake160;
};
export default _default;
