import { BI } from "@ckb-lumos/lumos";
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
interface EthereumRpc {
    (payload: {
        method: 'personal_sign';
        params: [string, string];
    }): Promise<string>;
}
export interface EthereumProvider {
    selectedAddress: string;
    isMetaMask?: boolean;
    enable: () => Promise<string[]>;
    addListener: (event: 'accountsChanged', listener: (addresses: string[]) => void) => void;
    removeEventListener: (event: 'accountsChanged', listener: (addresses: string[]) => void) => void;
    request: EthereumRpc;
}
export declare const ethereum: EthereumProvider;
export declare function asyncSleep(ms: number): Promise<void>;
interface Options {
    from: string;
    to: string;
    amount: string;
}
export declare function transfer(options: Options): Promise<string>;
export declare function capacityOf(address: string): Promise<BI>;
export {};
