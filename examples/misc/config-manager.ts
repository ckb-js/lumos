import { config, helpers } from "@ckb-lumos/lumos";

const script = {
  codeHash: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
  hashType: config.predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
  args: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
};

/* initialize config via AGGRON testnet */
config.initializeConfig(config.predefined.AGGRON4);
console.log("testnet address is:", helpers.encodeToAddress(script));

/* initialize config via LINA testnet */
config.initializeConfig(config.predefined.LINA);
console.log("mainnet address is:", helpers.encodeToAddress(script));
