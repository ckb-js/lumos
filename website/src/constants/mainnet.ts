import { config } from "@ckb-lumos/lumos";

export const MAINNET_SCRIPTS: config.ScriptConfigs = {
  ...config.predefined.LINA.SCRIPTS,
  PW_LOCK: {
    CODE_HASH:
      "0xbf43c3602455798c1a61a596e0d95278864c552fafe231c063b3fabf97a8febc",
    HASH_TYPE: "type",
    TX_HASH:
      "0x1d60cb8f4666e039f418ea94730b1a8c5aa0bf2f7781474406387462924d15d4",
    INDEX: "0x0",
    DEP_TYPE: "code",
  },
  CHEQUE: {
    CODE_HASH:
      "0xe4d4ecc6e5f9a059bf2f7a82cca292083aebc0c421566a52484fe2ec51a9fb0c",
    HASH_TYPE: "type",
    TX_HASH:
      "0x04632cc459459cf5c9d384b43dee3e36f542a464bdd4127be7d6618ac6f8d268",
    INDEX: "0x0",
    DEP_TYPE: "depGroup",
  },
  OMNI_LOCK: {
    CODE_HASH:
      "0x9f3aeaf2fc439549cbc870c653374943af96a0658bd6b51be8d8983183e6f52f",
    HASH_TYPE: "type",
    TX_HASH:
      "0xaa8ab7e97ed6a268be5d7e26d63d115fa77230e51ae437fc532988dd0c3ce10a",
    INDEX: "0x1",
    DEP_TYPE: "code",
  },
};

export const MAINNET_CONFIG: config.Config = {
  PREFIX: config.predefined.LINA.PREFIX,
  SCRIPTS: MAINNET_SCRIPTS,
};
