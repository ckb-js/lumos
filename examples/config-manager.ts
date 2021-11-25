import { config, helpers } from "@ckb-lumos/lumos";

const script = {
  code_hash: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
  hash_type: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
  args: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
};

/* DEPRECATED: initialize config via env mainnet */
console.log("deprecated initialize", helpers.generateAddress(script));

/* initialize config via AGGRON testnet */
config.initializeConfig(config.predefined.AGGRON4);
console.log("testnet address is:", helpers.generateAddress(script));

/* initialize config via LINA testnet */
config.initializeConfig(config.predefined.LINA);
console.log("mainnet address is:", helpers.generateAddress(script));
