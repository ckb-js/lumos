/// <reference types="node" />
import { HexString } from "@ckb-lumos/base";
export declare function mnemonicToSeedSync(mnemonic?: string, password?: string): Buffer;
export declare function mnemonicToSeed(mnemonic?: string, password?: string): Promise<Buffer>;
export declare function mnemonicToEntropy(mnemonic?: string): HexString;
export declare function entropyToMnemonic(entropyStr: HexString): string;
export declare function validateMnemonic(mnemonic: string): boolean;
export declare function generateMnemonic(): string;
declare const _default: {
    entropyToMnemonic: typeof entropyToMnemonic;
    mnemonicToEntropy: typeof mnemonicToEntropy;
    mnemonicToSeed: typeof mnemonicToSeed;
    mnemonicToSeedSync: typeof mnemonicToSeedSync;
    validateMnemonic: typeof validateMnemonic;
    generateMnemonic: typeof generateMnemonic;
};
export default _default;
