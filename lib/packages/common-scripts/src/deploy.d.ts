import { Script, OutPoint, CellProvider } from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType } from "@ckb-lumos/helpers";
import { FromInfo } from "./from_info";
import { BI, BIish } from "@ckb-lumos/bi";
import RPC from '@ckb-lumos/rpc';
declare function calculateTxFee(txSkeleton: TransactionSkeletonType, feeRate: BIish): BI;
interface ScriptConfig {
    CODE_HASH: string;
    HASH_TYPE: "type" | "data";
    TX_HASH: string;
    INDEX: string;
    DEP_TYPE: "depGroup" | "code";
    SHORT_ID?: number;
}
interface DeployOptions {
    cellProvider: CellProvider;
    scriptBinary: Uint8Array;
    fromInfo: FromInfo;
    config?: Config;
    feeRate?: bigint;
}
interface UpgradeOptions extends DeployOptions {
    typeId: Script;
}
interface DeployResult {
    txSkeleton: TransactionSkeletonType;
    scriptConfig: ScriptConfig;
}
interface TypeIDDeployResult extends DeployResult {
    typeId: Script;
}
/**
 * Generate txSkeleton for writing binary data to CKB, usually for deploying contracts.
 * This generator only supports `SECP256K1_BLAKE160` and `SECP256K1_BLAKE160_MULTISIG` currently.
 *
 * @param options
 */
export declare function generateDeployWithDataTx(options: DeployOptions): Promise<DeployResult>;
/**
 * Generate txSkeleton for writing binary data to CKB via Type ID, usually for deploying contracts.
 * Deploying via Type ID makes it possible to upgrade contract, for more information about Type ID, please check: https://xuejie.space/2020_02_03_introduction_to_ckb_script_programming_type_id/
 * This generator only supports `SECP256K1_BLAKE160` and `SECP256K1_BLAKE160_MULTISIG` currently.
 *
 * @param options
 */
export declare function generateDeployWithTypeIdTx(options: DeployOptions): Promise<TypeIDDeployResult>;
export declare function generateUpgradeTypeIdDataTx(options: UpgradeOptions): Promise<DeployResult>;
export declare function compareScriptBinaryWithOnChainData(scriptBinary: Uint8Array, outPoint: OutPoint, rpc: RPC): Promise<boolean>;
declare const _default: {
    generateDeployWithDataTx: typeof generateDeployWithDataTx;
    generateDeployWithTypeIdTx: typeof generateDeployWithTypeIdTx;
    generateUpgradeTypeIdDataTx: typeof generateUpgradeTypeIdDataTx;
    compareScriptBinaryWithOnChainData: typeof compareScriptBinaryWithOnChainData;
    __tests__: {
        calculateTxFee: typeof calculateTxFee;
    };
};
export default _default;
