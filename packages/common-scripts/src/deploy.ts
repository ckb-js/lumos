import { Script, OutPoint, CellProvider, Cell, utils } from "@ckb-lumos/base";
import * as common from './common';
import { getConfig } from '@ckb-lumos/config-manager';
import { Config } from "@ckb-lumos/config-manager";
import { TransactionSkeletonType, TransactionSkeleton, generateAddress, minimalCellCapacity } from "@ckb-lumos/helpers";
import { Reader } from "ckb-js-toolkit";
import { RPC } from "@ckb-lumos/rpc";

function bytesToHex(bytes: Uint8Array): string {
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

async function findCellsByLock(lockScript: Script, cellProvider: CellProvider): Promise<Cell[]> {
  const collector = cellProvider.collector({ lock: lockScript });
  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }
  return cells;
};

function updateOutputs(txSkeleton: TransactionSkeletonType, output: Cell): TransactionSkeletonType {
  const cellCapacity = minimalCellCapacity(output);
  output.cell_output.capacity = `0x${cellCapacity.toString(16)}`;
  txSkeleton = txSkeleton.update('outputs', (outputs) => {
    return outputs.push(output);
  });

  return txSkeleton;
}

function updateCellDeps(txSkeleton: TransactionSkeletonType, config?: Config): TransactionSkeletonType {
  txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
    return cellDeps.clear();
  });
  config = config || getConfig();
  const secp256k1Config = config.SCRIPTS.SECP256K1_BLAKE160!;
  const secp256k1MultiSigConfig = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!;
  txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
    return cellDeps.push({
      out_point: { tx_hash: secp256k1Config.TX_HASH, index: secp256k1Config.INDEX },
      dep_type: secp256k1Config.DEP_TYPE,
    }, 
    // TODO: optimize me, push dep directly without checking actual locks used would cause bigger tx
    {
      out_point: { tx_hash: secp256k1MultiSigConfig.TX_HASH, index: secp256k1MultiSigConfig.INDEX },
      dep_type: secp256k1MultiSigConfig.DEP_TYPE,
    });
  });

  return txSkeleton;
}

async function completeTx(
  txSkeleton: TransactionSkeletonType,
  fromAddress: string,
  feeRate?: bigint,
  config?: Config,
): Promise<TransactionSkeletonType> {
  const inputCapacity = txSkeleton
    .get('inputs')
    .map((c) => BigInt(c.cell_output.capacity))
    .reduce((a, b) => a + b, BigInt(0));
  const outputCapacity = txSkeleton
    .get('outputs')
    .map((c) => BigInt(c.cell_output.capacity))
    .reduce((a, b) => a + b, BigInt(0));
  const needCapacity = outputCapacity - inputCapacity + BigInt(10) ** BigInt(8);
  txSkeleton = await common.injectCapacity(txSkeleton, [fromAddress], needCapacity, undefined, undefined, {
    config: config,
    enableDeductCapacity: false,
  });
  feeRate = feeRate || BigInt(1000);
  txSkeleton = await common.payFeeByFeeRate(txSkeleton, [fromAddress], feeRate, undefined, {
    config: config,
  });
  return txSkeleton;
}

function calculateCodeHashByBin(scriptBin: Uint8Array): string {
  const bin = scriptBin.valueOf();
  return new utils.CKBHasher().update(bin.buffer.slice(bin.byteOffset, bin.byteLength + bin.byteOffset)).digestHex();
}

async function getDataHash(outPoint: OutPoint, rpc: RPC): Promise<string> {
  const txHash = outPoint.tx_hash;
  const index = parseInt(outPoint.index, 10);
  const tx = await rpc.get_transaction(txHash);

  if (!tx) throw new Error(`TxHash(${txHash}) is not found`);

  const outputData = tx.transaction.outputs_data[index];
  if (!outputData) throw new Error(`cannot find output data`);

  return new utils.CKBHasher().update(new Reader(outputData)).digestHex();
}

interface DeployOptions {
  cellProvider: CellProvider;
  scriptBinary: Uint8Array;
  outputScriptLock: Script;
  feeRate?: bigint;
  config?: Config;
}

export async function generateDeployWithDataTx(
  options: DeployOptions
): Promise<TransactionSkeletonType> {
  let txSkeleton = TransactionSkeleton({ cellProvider: options.cellProvider });

  const fromAddress = generateAddress(options.outputScriptLock, { config: options.config });

  const output: Cell = {
    cell_output: {
      capacity: '0x0',
      lock: options.outputScriptLock,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = await completeTx(txSkeleton, fromAddress, options.feeRate, options.config);

  return updateCellDeps(txSkeleton, options.config);
}

export async function generateDeployWithTypeIdTx(
  options: DeployOptions
): Promise<TransactionSkeletonType> {
  let txSkeleton = TransactionSkeleton({ cellProvider: options.cellProvider });

  const fromAddress = generateAddress(options.outputScriptLock, { config: options.config });

  const [resolved] = await findCellsByLock(options.outputScriptLock, options.cellProvider);
  if (!resolved) throw new Error(`${fromAddress} has no live ckb`);

  const typeId = utils.generateTypeIdScript({ previous_output: resolved.out_point!, since: '0x0' }, '0x0');
  const output: Cell = {
    cell_output: {
      capacity: '0x0',
      lock: options.outputScriptLock,
      type: typeId,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = await completeTx(txSkeleton, fromAddress, options.feeRate, options.config);

  return updateCellDeps(txSkeleton, options.config);
}

interface UpgradeOptions extends DeployOptions {
  typeId: Script;
}

export async function generateUpgradeTypeIdDataTx(
  options: UpgradeOptions
): Promise<TransactionSkeletonType> {
  let txSkeleton = TransactionSkeleton({ cellProvider: options.cellProvider });

  const fromAddress = generateAddress(options.outputScriptLock, { config: options.config });

  const collector = options.cellProvider.collector({ type: options.typeId });
  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }
  if (cells.length !== 1) throw new Error("the typeid maybe wrong");

  const deployedCell = cells[0];
  txSkeleton = txSkeleton.update('inputs', (inputs) => {
    return inputs.push(deployedCell);
  });

  const output: Cell = {
    cell_output: {
      capacity: '0x0',
      lock: options.outputScriptLock,
      type: options.typeId,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = await completeTx(txSkeleton, fromAddress, options.feeRate, options.config);

  return updateCellDeps(txSkeleton, options.config);
}

export async function compareScriptBinaryWithOnChainData(
  scriptBinary: Uint8Array,
  outPoint: OutPoint,
  rpc: RPC
): Promise<boolean> {
  const localHash = calculateCodeHashByBin(scriptBinary);
  const onChainHash = await getDataHash(outPoint, rpc);
  return localHash === onChainHash;
}
