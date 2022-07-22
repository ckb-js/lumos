import { PackedSince, Hash, Address, Script, HexString } from "@ckb-lumos/base";
import { Options } from "@ckb-lumos/helpers";
/**
 * secp256k1_blake160_multisig script requires S, R, M, N and public key hashes
 * S must be zero now
 * and N equals to publicKeyHashes size
 * so only need to provide R, M and public key hashes
 */
export interface MultisigScript {
    /** first nth public keys must match, 1 byte */
    R: number;
    /** threshold, 1 byte */
    M: number;
    /** blake160 hashes of compressed public keys */
    publicKeyHashes: Hash[];
    /** locktime in since format */
    since?: PackedSince;
}
export interface ACP {
    address: Address;
    destroyable?: boolean;
}
export interface CustomScript {
    script: Script;
    customData: HexString;
}
export declare type FromInfo = MultisigScript | Address | ACP | CustomScript;
/**
 *
 * @param params multisig script params
 * @returns serialized multisig script
 */
export declare function serializeMultisigScript({ R, M, publicKeyHashes, }: MultisigScript): HexString;
/**
 *
 * @param serializedMultisigScript
 * @param since
 * @returns lock script args
 */
export declare function multisigArgs(serializedMultisigScript: HexString, since?: PackedSince): HexString;
export declare function parseFromInfo(fromInfo: FromInfo, { config }?: Options): {
    fromScript: Script;
    multisigScript?: HexString;
    destroyable?: boolean;
    customData?: HexString;
};
