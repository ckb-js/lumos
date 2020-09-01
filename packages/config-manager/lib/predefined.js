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
    SUDT: {
      CODE_HASH:
        "0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5",
      HASH_TYPE: "type",
      TX_HASH:
        "0xc7813f6a415144643970c2e88e0bb6ca6a8edc5dd7c1022746f628284a9936d5",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
    ANYONE_CAN_PAY: {
      CODE_HASH:
        "0x0fb343953ee78c9986b091defb6252154e0bb51044fd2879fde5b27314506111",
      HASH_TYPE: "data",
      TX_HASH:
        "0xa05f28c9b867f8c5682039c10d8e864cf661685252aa74a008d255c33813bb81",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
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
        "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
      INDEX: "0x1",
      DEP_TYPE: "dep_group",
      SHORT_ID: 1,
    },
    DAO: {
      CODE_HASH:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      HASH_TYPE: "type",
      TX_HASH:
        "0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f",
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
    ANYONE_CAN_PAY: {
      CODE_HASH:
        "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
      HASH_TYPE: "type",
      TX_HASH:
        "0x4f32b3e39bd1b6350d326fdfafdfe05e5221865c3098ae323096f0bfc69e0a8c",
      INDEX: "0x0",
      DEP_TYPE: "dep_group",
    },
  },
});

module.exports = {
  LINA,
  AGGRON4,
};
