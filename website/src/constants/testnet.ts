import { config } from "@ckb-lumos/lumos";

const TESTNET_SCRIPTS: config.ScriptConfigs = {
  ...config.predefined.AGGRON4.SCRIPTS,
  PW_LOCK: {
    CODE_HASH:
      "0x58c5f491aba6d61678b7cf7edf4910b1f5e00ec0cde2f42e0abb4fd9aff25a63",
    HASH_TYPE: "type",
    TX_HASH:
      "0x57a62003daeab9d54aa29b944fc3b451213a5ebdf2e232216a3cfed0dde61b38",
    INDEX: "0x0",
    DEP_TYPE: "code",
  },
  CHEQUE: {
    CODE_HASH:
      "0x60d5f39efce409c587cb9ea359cefdead650ca128f0bd9cb3855348f98c70d5b",
    HASH_TYPE: "type",
    TX_HASH:
      "0x7f96858be0a9d584b4a9ea190e0420835156a6010a5fde15ffcdc9d9c721ccab",
    INDEX: "0x0",
    DEP_TYPE: "dep_group",
  },
  OMNILOCK: {
    CODE_HASH:
      "0x79f90bb5e892d80dd213439eeab551120eb417678824f282b4ffb5f21bad2e1e",
    HASH_TYPE: "type",
    TX_HASH:
      "0x9154df4f7336402114d04495175b37390ce86a4906d2d4001cf02c3e6d97f39c",
    INDEX: "0x0",
    DEP_TYPE: "code",
  },
};

export const TESTNET_CONFIG: config.Config = {
  PREFIX: "ckt",
  SCRIPTS: TESTNET_SCRIPTS,
};
