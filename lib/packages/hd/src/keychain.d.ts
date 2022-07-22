/// <reference types="node" />
export default class Keychain {
    privateKey: Buffer;
    publicKey: Buffer;
    chainCode: Buffer;
    index: number;
    depth: number;
    identifier: Buffer;
    fingerprint: number;
    parentFingerprint: number;
    constructor(privateKey: Buffer, chainCode: Buffer);
    calculateFingerprint(): void;
    static fromSeed(seed: Buffer): Keychain;
    static fromPublicKey(publicKey: Buffer, chainCode: Buffer, path: String): Keychain;
    deriveChild(index: number, hardened: boolean): Keychain;
    derivePath(path: string): Keychain;
    isNeutered(): Boolean;
    hash160(data: Buffer): Buffer;
    private static privateKeyAdd;
    private static publicKeyAdd;
}
