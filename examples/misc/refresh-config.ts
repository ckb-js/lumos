// This example shows how to automatically refresh the script config
// to avoid the "Unknown OutPoint(...)" error when the script is deployed with type id.

import { config, RPC } from "@ckb-lumos/lumos";

const rpc = new RPC("https://testnet.ckb.dev");

async function main() {
  const outdatedConfig: config.ScriptConfigs = {
    OMNILOCK: {
      CODE_HASH: "0xf329effd1c475a2978453c8600e1eaf0bc2087ee093c3ee64cc96ec6847752cb",
      HASH_TYPE: "type",
      // an outdated deployment transaction
      // https://pudge.explorer.nervos.org/transaction/0xff234bf2fb0ad2ab5b356ceda317d3dee3efb2c55b9427ef55d9dcbf6eecbf9f
      TX_HASH: "0xff234bf2fb0ad2ab5b356ceda317d3dee3efb2c55b9427ef55d9dcbf6eecbf9f",
      INDEX: "0x0",
      DEP_TYPE: "code",
    },
  };
  const refreshed = await config.refreshScriptConfigs(outdatedConfig, {
    resolve: config.createRpcResolver(rpc),
  });

  console.assert(
    outdatedConfig.OMNILOCK?.TX_HASH !== refreshed.OMNILOCK?.TX_HASH,
    "Omnilock script config should be refreshed"
  );

  console.log("The latest Omnilock is deployed at", refreshed.OMNILOCK?.TX_HASH);
}

main();
