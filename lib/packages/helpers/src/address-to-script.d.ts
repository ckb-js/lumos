import { Address, Script } from "@ckb-lumos/base";
import { Options } from "./";
/**
 * full version identifies the hashType
 */
export declare const ADDRESS_FORMAT_FULL = 0;
/**
 * @deprecated
 * short version for locks with popular codeHash, deprecated
 */
export declare const ADDRESS_FORMAT_SHORT = 1;
/**
 * @deprecated
 * full version with hashType = "Data", deprecated
 */
export declare const ADDRESS_FORMAT_FULLDATA = 2;
/**
 * @deprecated
 * full version with hashType = "Type", deprecated
 */
export declare const ADDRESS_FORMAT_FULLTYPE = 4;
export declare function parseFullFormatAddress(address: Address, { config }: Options): Script;
export declare function parseDeprecatedCkb2019Address(address: string, { config }: Options): Script;
