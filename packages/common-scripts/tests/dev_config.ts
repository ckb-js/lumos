import { Config } from "@ckb-lumos/config-manager";

export const DEV_CONFIG: Config = {
  PREFIX: "ckt",
  SCRIPTS: {
    SECP256K1_BLAKE160: {
      CODE_HASH: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      HASH_TYPE: "type",
      TX_HASH:
        // "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
        "0x785aa819c8f9f8565a62f744685f8637c1b34886e57154e4e5a2ac7f225c7bf5",
      INDEX: "0x0",
      DEP_TYPE: "depGroup",
      SHORT_ID: 0,
    },
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH: "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      HASH_TYPE: "type",
      TX_HASH:
        // "0x6495cede8d500e4309218ae50bbcadb8f722f24cc7572dd2274f5876cb603e4e",
        "0x785aa819c8f9f8565a62f744685f8637c1b34886e57154e4e5a2ac7f225c7bf5",
      INDEX: "0x1",
      DEP_TYPE: "depGroup",
      SHORT_ID: 1,
    },
    DAO: {
      CODE_HASH: "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      HASH_TYPE: "type",
      TX_HASH:
        // "0x96fea0dfaac1186fbb98fd452cb9b13976f9a00bcce130035fe2e30dac931d1d",
        "0x13c137fdf071c0ab3e6a4c8aaefc16c9bb7b9593b77822b151b18412ecd2ee41",
      INDEX: "0x2",
      DEP_TYPE: "code",
    },
  },
};
