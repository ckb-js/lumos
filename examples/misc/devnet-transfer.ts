// This example shows how to transfer 100 CKB from ALice to Bob on Devnet.
// Note: The ScriptConfig is generated from the genesis block, therefore,
//  it does NOT contain all common configs, such as Anyone-can-pay, Omnilock, etc. that are deployed after genesis.

import { commons, config, hd, helpers, Indexer, RPC } from "@ckb-lumos/lumos";
import { parseUnit } from "@ckb-lumos/bi";

const debug = (...args: unknown[]) => console.log(new Date().toJSON(), "[info]", ...args);

// let's treat testnet as a devnet
const RPC_URL = "https://testnet.ckb.dev";
// const RPC_URL = "http://localhost:8114";
const ALICE_PRIVATE_KEY = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
const BOB_PRIVATE_KEY = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

async function main() {
  const rpc = new RPC(RPC_URL);
  const indexer = new Indexer(RPC_URL);

  const genesisBlock = await rpc.getBlockByNumber("0x0");
  const scriptConfig = config.generateGenesisScriptConfigs(genesisBlock);

  const txSkeleton = helpers.TransactionSkeleton({ cellProvider: indexer }).asMutable();

  const secp256k1ScriptConfig = scriptConfig.SECP256K1_BLAKE160;
  const managerConfig = { PREFIX: "ckt", SCRIPTS: scriptConfig } as const;
  const configParam = { config: managerConfig };

  const aliceAddr = helpers.encodeToAddress(
    {
      codeHash: secp256k1ScriptConfig.CODE_HASH,
      hashType: secp256k1ScriptConfig.HASH_TYPE,
      args: hd.key.privateKeyToBlake160(ALICE_PRIVATE_KEY),
    },
    configParam
  );

  const bobAddr = helpers.encodeToAddress(
    {
      codeHash: secp256k1ScriptConfig.CODE_HASH,
      hashType: secp256k1ScriptConfig.HASH_TYPE,
      args: hd.key.privateKeyToBlake160(BOB_PRIVATE_KEY),
    },
    configParam
  );

  debug(`Alice(${aliceAddr})`, "->", `Bob(${bobAddr})`);
  debug(`Please make sure Alice(${aliceAddr}) has enough capacity before continue`);

  await commons.common.transfer(
    txSkeleton,
    [aliceAddr],
    bobAddr,
    parseUnit("100", "ckb"),
    undefined,
    undefined,
    configParam
  );
  await commons.common.payFeeByFeeRate(txSkeleton, [aliceAddr], 1000, undefined, configParam);
  commons.common.prepareSigningEntries(txSkeleton);

  const digest = txSkeleton.get("signingEntries").get(0)!.message;
  debug("digest for signing:", digest);

  const signature = hd.key.signRecoverable(digest, ALICE_PRIVATE_KEY);
  const tx = helpers.sealTransaction(txSkeleton, [signature]);

  const txHash = await rpc.sendTransaction(tx);
  debug("TxHash:", txHash);
}

main();
