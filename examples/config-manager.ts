import { initializeConfig, predefined } from "@ckb-lumos/config-manager";
import { generateAddress } from "@ckb-lumos/helpers";

const script = {
  code_hash: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.CODE_HASH,
  hash_type: predefined.AGGRON4.SCRIPTS.SECP256K1_BLAKE160.HASH_TYPE,
  args: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
};

/* DEPRECATED: initialize config via env mainnet */
console.log("deprecated initialize", generateAddress(script));

/* initialize config via AGGRON testnet */
initializeConfig(predefined.AGGRON4);
console.log("testnet address is:", generateAddress(script));

/* initialize config via LINA testnet */
initializeConfig(predefined.LINA);
console.log("mainnet address is:", generateAddress(script));
