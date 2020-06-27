const deepFreeze = require("deep-freeze-strict");

const LINA = deepFreeze({
  PREFIX: "ckb",
  SCRIPTS: {
    SECP256K1_BLAKE160: {
      CODE_HASH:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      HASH_TYPE: "type",
      TX_HASH:
        "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
      SHORT_ID: 0,
    },
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      HASH_TYPE: "type",
      TX_HASH:
        "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c",
      INDEX: "0x1",
      DEP_TYPE: "dep_group",
      SHORT_ID: 1,
    },
    DAO: {
      CODE_HASH:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      HASH_TYPE: "type",
      TX_HASH:
        "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
      INDEX: "0x2",
      DEP_TYPE: "code",
    },
  },
});

const AGGRON4 = deepFreeze({
  PREFIX: "ckt",
  SCRIPTS: {
    SECP256K1_BLAKE160: {
      CODE_HASH:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      HASH_TYPE: "type",
      TX_HASH:
        "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
      SHORT_ID: 0,
    },
    SECP256K1_BLAKE160_MULTISIG: {
      CODE_HASH:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      HASH_TYPE: "type",
      TX_HASH:
        "0x6495cede8d500e4309218ae50bbcadb8f722f24cc7572dd2274f5876cb603e4e",
      INDEX: "0x1",
      DEP_TYPE: "dep_group",
      SHORT_ID: 1,
    },
    DAO: {
      CODE_HASH:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      HASH_TYPE: "type",
      TX_HASH:
        "0x96fea0dfaac1186fbb98fd452cb9b13976f9a00bcce130035fe2e30dac931d1d",
      INDEX: "0x2",
      DEP_TYPE: "code",
    },
    SUDT: {
      CODE_HASH:
        "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
      HASH_TYPE: "data",
      TX_HASH:
        "0xc1b2ae129fad7465aaa9acc9785f842ba3e6e8b8051d899defa89f5508a77958",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  },
});

module.exports = {
  LINA,
  AGGRON4,
};
