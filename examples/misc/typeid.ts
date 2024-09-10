// This example demonstrates how to create a TypeID cell
// You can check a completed transaction here
// https://pudge.explorer.nervos.org/transaction/0x9cd5a253de6a4e2d4b8c46c483154db92b5c35e831e8ddf4ea5674746c03f371

import { Indexer } from "@ckb-lumos/lumos/ckb-indexer";
import { RPC } from "@ckb-lumos/lumos/rpc";
import { generateGenesisScriptConfigs, initializeConfig } from "@ckb-lumos/lumos/config";
import {
  cellHelper,
  encodeToAddress,
  minimalCellCapacity,
  sealTransaction,
  TransactionSkeleton,
} from "@ckb-lumos/lumos/helpers";
import type { Cell, Script } from "@ckb-lumos/lumos/base";
import { key } from "@ckb-lumos/lumos/hd";
import { generateTypeIdScript } from "@ckb-lumos/lumos/utils";
import {
  injectCapacity,
  payFeeByFeeRate,
  prepareSigningEntries,
  setupInputCell,
} from "@ckb-lumos/lumos/common-scripts/common";
import { BI } from "@ckb-lumos/lumos/bi";

const ENDPOINT = "https://testnet.ckb.dev";

const PRIVATE_KEY = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

async function main() {
  const indexer = new Indexer(ENDPOINT);
  const rpc = new RPC(ENDPOINT);

  const genesisBlock = await rpc.getBlockByNumber("0x0");
  const scriptConfigs = generateGenesisScriptConfigs(genesisBlock);

  initializeConfig({ PREFIX: "ckt", SCRIPTS: scriptConfigs });

  // Define the transaction skeleton as mutable here for convenient demonstration
  const txSkeleton = TransactionSkeleton({ cellProvider: indexer }).asMutable();

  const lock: Script = {
    codeHash: scriptConfigs.SECP256K1_BLAKE160.CODE_HASH,
    hashType: scriptConfigs.SECP256K1_BLAKE160.HASH_TYPE,
    args: key.privateKeyToBlake160(PRIVATE_KEY),
  };
  const address = encodeToAddress(lock);

  // tip: the source cell's OutPoint is required to generate the TypeID cell
  let sourceCell: Cell | undefined = undefined;
  for await (const cell of indexer.collector({ lock, type: "empty", data: "0x" }).collect()) {
    sourceCell = cell;
    break;
  }
  if (!sourceCell || !sourceCell.outPoint) {
    throw new Error(`Cannot find any cell from the lock`);
  }

  // 🌟Step 1. Put the TypeID cell to the first output
  const typeId = generateTypeIdScript({ previousOutput: sourceCell.outPoint, since: "0x0" });
  const typeIdCell = cellHelper.create({ lock, type: typeId });

  txSkeleton.update("outputs", (outputs) => outputs.push(typeIdCell));

  // 🌟Step 2. Put the source OutPoint into the transaction
  await setupInputCell(txSkeleton, sourceCell);

  // Step 3. Handle the capacity
  const minimalNeededCapacity = minimalCellCapacity(sourceCell) + BigInt(typeIdCell.cellOutput.capacity);
  const collectedCapacity = BigInt(sourceCell.cellOutput.capacity);

  // if the collected capacity is not enough,
  // inject the capacity for the TypeID cell
  if (collectedCapacity <= minimalNeededCapacity) {
    await injectCapacity(txSkeleton, [address], typeIdCell.cellOutput.capacity);
  } else {
    // if the collected capacity is enough,
    // deduct the capacity from the source cell for the TypeID cell
    txSkeleton.update("outputs", (outputs) => {
      const outputSourceCell = cellHelper.clone(sourceCell!);
      outputSourceCell.cellOutput.capacity = BI.from(outputSourceCell.cellOutput.capacity)
        .sub(typeIdCell.cellOutput.capacity)
        .toHexString();
      return outputs.set(1, outputSourceCell);
    });
  }

  await payFeeByFeeRate(txSkeleton, [address], 1000);
  prepareSigningEntries(txSkeleton);

  const signatures = txSkeleton
    .get("signingEntries")
    .map((entry) => key.signRecoverable(entry.message, PRIVATE_KEY))
    .toArray();

  const signedTx = sealTransaction(txSkeleton, signatures);
  const txHash = await rpc.sendTransaction(signedTx);

  console.log("txHash:", txHash);
}

main();
