/// <reference types="node" />
import { HexString } from "@ckb-lumos/base";
export declare enum AddressType {
    Receiving = 0,
    Change = 1
}
export interface PublicKeyInfo {
    blake160: HexString;
    path: string;
    publicKey: HexString;
}
export declare class ExtendedPublicKey {
    publicKey: HexString;
    chainCode: HexString;
    constructor(publicKey: HexString, chainCode: HexString);
    serialize(): HexString;
    static parse(serialized: HexString): ExtendedPublicKey;
}
export declare class AccountExtendedPublicKey extends ExtendedPublicKey {
    static ckbAccountPath: string;
    static parse(serialized: HexString): AccountExtendedPublicKey;
    publicKeyInfo(type: AddressType, index: number): PublicKeyInfo;
    static pathForReceiving(index: number): string;
    static pathForChange(index: number): string;
    static pathFor(type: AddressType, index: number): string;
    private getPublicKey;
}
export interface PrivateKeyInfo {
    privateKey: HexString;
    publicKey: HexString;
    path: string;
}
export declare class ExtendedPrivateKey {
    privateKey: HexString;
    chainCode: HexString;
    constructor(privateKey: HexString, chainCode: HexString);
    serialize(): HexString;
    toExtendedPublicKey(): ExtendedPublicKey;
    toAccountExtendedPublicKey(): AccountExtendedPublicKey;
    static fromSeed(seed: Buffer): ExtendedPrivateKey;
    privateKeyInfo(type: AddressType, index: number): PrivateKeyInfo;
    privateKeyInfoByPath(path: string): PrivateKeyInfo;
    private privateKeyInfoFromKeychain;
    static parse(serialized: HexString): ExtendedPrivateKey;
}
