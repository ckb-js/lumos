// This example demonstrates how to write custom data to the cell to simulate the inscription

import { Cell, Indexer, RPC, hd, Script } from "@ckb-lumos/lumos";
import { generateGenesisScriptConfigs, initializeConfig } from "@ckb-lumos/lumos/config";
import { hexify } from "@ckb-lumos/lumos/codec";
import { common } from "@ckb-lumos/lumos/common-scripts";
import {
  encodeToAddress,
  minimalCellCapacityCompatible,
  sealTransaction,
  TransactionSkeleton,
} from "@ckb-lumos/lumos/helpers";

const ENDPOINT = "https://testnet.ckb.dev";
const PRIVATE_KEY = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

async function main() {
  const indexer = new Indexer(ENDPOINT);
  const rpc = new RPC(ENDPOINT);

  const genesisBlock = await rpc.getBlockByNumber("0x0");
  const scriptConfigs = generateGenesisScriptConfigs(genesisBlock);

  initializeConfig({ PREFIX: "ckt", SCRIPTS: scriptConfigs });

  const lock: Script = {
    codeHash: scriptConfigs.SECP256K1_BLAKE160.CODE_HASH,
    hashType: scriptConfigs.SECP256K1_BLAKE160.HASH_TYPE,
    args: hd.key.privateKeyToBlake160(PRIVATE_KEY),
  };

  const address = encodeToAddress(lock);
  console.log("Inscribe to the address:", address);

  const encoder = new TextEncoder();
  const mint = {
    p: "brc-20",
    op: "mint",
    tick: "ordi",
    amt: "1000",
  };
  const message = hexify(encoder.encode(JSON.stringify(mint)));
  console.log("Inscription message:", mint);
  console.log("Inscription message(binary format):", message);

  const inscriptionCell: Cell = {
    cellOutput: { capacity: "0x0", lock },
    data: message,
  };
  // set the minimal capacity for the inscription cell
  const capacity = minimalCellCapacityCompatible(inscriptionCell).toHexString();
  inscriptionCell.cellOutput.capacity = capacity;

  const txSkeleton = TransactionSkeleton({
    cellProvider: {
      // IMPORTANT: avoid collecting cell with type or data
      collector: (queryOptions) =>
        indexer.collector({
          ...queryOptions,
          type: "empty",
          data: { data: "0x", searchMode: "exact" },
        }),
    },
  }).asMutable();

  txSkeleton.update("outputs", (outputs) => outputs.push(inscriptionCell));
  // inject capacity to fill the inscription cell
  await common.injectCapacity(
    txSkeleton,
    [address],
    capacity,
    undefined,
    undefined,
    // IMPORTANT: avoid deducting capacity from the inscription cell
    { enableDeductCapacity: false }
  );
  await common.payFeeByFeeRate(txSkeleton, [address], 1000, undefined);
  common.prepareSigningEntries(txSkeleton);

  const signatures = txSkeleton
    .get("signingEntries")
    .map((entry) => hd.key.signRecoverable(entry.message, PRIVATE_KEY))
    .toArray();

  const signedTx = sealTransaction(txSkeleton, signatures);

  const txHash = await rpc.sendTransaction(signedTx);
  console.log("Sent transaction hash:", txHash);
}

main();
