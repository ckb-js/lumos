import { ScriptConfig } from "./types";
export declare type ScriptRecord = Record<string, ScriptConfig>;
/**
 * create a frozen {@link ScriptConfig}, also this is a TypeScript helper to create an autocomplete-friendly {@link ScriptConfigs}
 * @param configShape
 */
export declare function createConfig<S extends ScriptRecord>(configShape: {
    PREFIX: string;
    SCRIPTS: S;
}): typeof configShape;
export declare const predefined: {
    LINA: {
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
    AGGRON4: {
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
};
