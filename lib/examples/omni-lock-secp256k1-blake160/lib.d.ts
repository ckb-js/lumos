import { BI, helpers, Hash } from "@ckb-lumos/lumos";
export declare const CONFIG: {
    PREFIX: string;
    SCRIPTS: {
        OMNI_LOCK: {
            CODE_HASH: string;
            HASH_TYPE: "type";
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: "code";
        };
        SECP256K1_BLAKE160: {
            CODE_HASH: string;
            HASH_TYPE: "type";
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: "depGroup";
            SHORT_ID: number;
        };
        SECP256K1_BLAKE160_MULTISIG: {
            CODE_HASH: string;
            HASH_TYPE: "type";
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: "depGroup";
            SHORT_ID: number;
        };
        DAO: {
            CODE_HASH: string;
            HASH_TYPE: "type";
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: "code";
        };
        SUDT: {
            CODE_HASH: string;
            HASH_TYPE: "type";
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: "code";
        };
        ANYONE_CAN_PAY: {
            CODE_HASH: string;
            HASH_TYPE: "type";
            TX_HASH: string;
            INDEX: string;
            DEP_TYPE: "depGroup";
            SHORT_ID: number;
        };
    };
};
export declare function asyncSleep(ms: number): Promise<void>;
export interface TransferOptions {
    from: string;
    to: string;
    amount: string;
}
export declare function buildTransfer(options: TransferOptions): Promise<helpers.TransactionSkeletonType>;
export declare function toMessages(tx: helpers.TransactionSkeletonType): {
    index: number;
    lock: import("@ckb-lumos/base/lib/api").Script;
    message: string;
};
export declare function signByPrivateKey(txSkeleton: helpers.TransactionSkeletonType, privateKey: string): Promise<helpers.TransactionSkeletonType>;
export declare function sendTransaction(tx: helpers.TransactionSkeletonType): Promise<Hash>;
export declare function capacityOf(address: string): Promise<BI>;
