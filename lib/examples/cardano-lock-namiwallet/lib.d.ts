import { BI } from "@ckb-lumos/lumos";
export declare const CONFIG: {
    PREFIX: string;
    SCRIPTS: {
        CARDANO_LOCK: {
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
export interface Cardano {
    nami: {
        enable: () => Promise<CIP30FullAPI>;
    };
}
export interface CIP30FullAPI {
    getUsedAddresses: () => Promise<string[]>;
    signData: (address: string, message: string) => Promise<{
        signature: string;
        key: string;
    }>;
}
declare global {
    interface Window {
        cardano: Cardano;
    }
}
export declare function detectCardano(): Promise<Cardano>;
interface Options {
    from: string;
    to: string;
    amount: string;
    api: CIP30FullAPI;
    cardanoAddr: string;
}
export declare function transfer(options: Options): Promise<string>;
export declare function capacityOf(address: string): Promise<BI>;
export {};
