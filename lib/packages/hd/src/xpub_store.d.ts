import { AccountExtendedPublicKey } from "./extended_key";
export declare class XPubStore {
    private accountExtendedPublicKey;
    constructor(accountExtendedPublicKey: AccountExtendedPublicKey);
    toAccountExtendedPublicKey(): AccountExtendedPublicKey;
    save(path: string, { overwrite, }?: {
        overwrite?: boolean;
    }): void;
    toJson(): string;
    static load(path: string): XPubStore;
}
