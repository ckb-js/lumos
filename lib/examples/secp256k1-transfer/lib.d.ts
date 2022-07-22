import { Address, Script, BI } from "@ckb-lumos/lumos";
export declare const AGGRON4: {
    PREFIX: string;
    SCRIPTS: {
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
declare type Account = {
    lockScript: Script;
    address: Address;
    pubKey: string;
};
export declare const generateAccountFromPrivateKey: (privKey: string) => Account;
export declare function capacityOf(address: string): Promise<BI>;
interface Options {
    from: string;
    to: string;
    amount: string;
    privKey: string;
}
export declare function transfer(options: Options): Promise<string>;
export {};
