import {
  Script,
  OutPoint,
  CellProvider,
  Cell,
  utils,
  values,
  core,
  WitnessArgs,
  Transaction,
} from "@ckb-lumos/base";
import { SerializeTransaction } from "@ckb-lumos/base/lib/core";
import { getConfig, Config, helpers } from "@ckb-lumos/config-manager";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
  minimalCellCapacity,
  Options,
  createTransactionFromSkeleton,
  parseAddress,
} from "@ckb-lumos/helpers";
import { Reader, normalizers } from "ckb-js-toolkit";
import { RPC } from "@ckb-lumos/rpc";
import { Set } from "immutable";
import { FromInfo, parseFromInfo, MultisigScript } from "./from_info";
const { ScriptValue } = values;

function bytesToHex(bytes: Uint8Array): string {
  return `0x${[...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function findCellsByLock(
  lockScript: Script,
  cellProvider: CellProvider
): Promise<Cell[]> {
  const collector = cellProvider.collector({
    lock: lockScript,
    type: "empty",
    data: "0x",
  });
  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }
  return cells;
}

function updateOutputs(
  txSkeleton: TransactionSkeletonType,
  output: Cell
): TransactionSkeletonType {
  const cellCapacity = minimalCellCapacity(output);
  output.cell_output.capacity = `0x${cellCapacity.toString(16)}`;
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  return txSkeleton;
}

function updateCellDeps(
  txSkeleton: TransactionSkeletonType,
  config?: Config
): TransactionSkeletonType {
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
    return cellDeps.clear();
  });
  config = config || getConfig();
  const secp256k1Config = config.SCRIPTS.SECP256K1_BLAKE160;
  const secp256k1MultiSigConfig = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  if (!secp256k1Config || !secp256k1MultiSigConfig) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE160 or SECP256K1_BLAKE160_MULTISIG script setup!"
    );
  }
  txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
    return cellDeps.push(
      {
        out_point: {
          tx_hash: secp256k1Config.TX_HASH,
          index: secp256k1Config.INDEX,
        },
        dep_type: secp256k1Config.DEP_TYPE,
      },
      // TODO: optimize me, push dep directly without checking actual locks used would cause bigger tx
      {
        out_point: {
          tx_hash: secp256k1MultiSigConfig.TX_HASH,
          index: secp256k1MultiSigConfig.INDEX,
        },
        dep_type: secp256k1MultiSigConfig.DEP_TYPE,
      }
    );
  });

  return txSkeleton;
}

async function completeTx(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  config?: Config
): Promise<TransactionSkeletonType> {
  const inputCapacity = txSkeleton
    .get("inputs")
    .map((c) => BigInt(c.cell_output.capacity))
    .reduce((a, b) => a + b, BigInt(0));
  const outputCapacity = txSkeleton
    .get("outputs")
    .map((c) => BigInt(c.cell_output.capacity))
    .reduce((a, b) => a + b, BigInt(0));
  const needCapacity = outputCapacity - inputCapacity;
  txSkeleton = await injectCapacity(txSkeleton, fromInfo, needCapacity, {
    config: config,
  });
  return txSkeleton;
}

async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  amount: bigint,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  const { fromScript, multisigScript } = parseFromInfo(fromInfo, { config });
  amount = BigInt(amount) + BigInt(10) ** BigInt(8);

  let changeCapacity: bigint = BigInt(10) ** BigInt(8);
  const changeCell: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: fromScript,
      type: undefined,
    },
    data: "0x",
  };
  const minimalChangeCapacity: bigint =
    minimalCellCapacity(changeCell) + BigInt(10) ** BigInt(8);

  if (amount < 0n) {
    changeCapacity -= amount;
  }

  if (amount > 0n) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) throw new Error("Cell provider is missing!");
    const cellCollector = cellProvider.collector({
      lock: fromScript,
      type: "empty",
      data: "0x",
    });

    let previousInputs = Set<string>();
    for (const input of txSkeleton.get("inputs")) {
      previousInputs = previousInputs.add(
        `${input.out_point!.tx_hash}_${input.out_point!.index}`
      );
    }

    for await (const inputCell of cellCollector.collect()) {
      if (
        previousInputs.has(
          `${inputCell.out_point!.tx_hash}_${inputCell.out_point!.index}`
        )
      )
        continue;
      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(inputCell)
      );
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
      const inputCapacity = BigInt(inputCell.cell_output.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > amount) {
        deductCapacity = amount;
      }
      amount -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;
      if (
        amount === BigInt(0) &&
        (changeCapacity === BigInt(0) ||
          changeCapacity >= minimalChangeCapacity)
      )
        break;
    }
  }

  if (changeCapacity > BigInt(0)) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
  }

  if (amount > 0n || changeCapacity < minimalChangeCapacity)
    throw new Error("Not enough capacity in from address!");

  /*
   * Modify the skeleton, so the first witness of the fromAddress script group
   * has a WitnessArgs construct with 65-byte zero filled values. While this
   * is not required, it helps in transaction fee estimation.
   */
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    let newWitnessArgs: WitnessArgs;
    const SECP_SIGNATURE_PLACEHOLDER =
      "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

    if (typeof fromInfo !== "string") {
      newWitnessArgs = {
        lock:
          "0x" +
          multisigScript!.slice(2) +
          SECP_SIGNATURE_PLACEHOLDER.slice(2).repeat(
            (fromInfo as MultisigScript).M
          ),
      };
    } else {
      newWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
    }

    if (witness !== "0x") {
      const witnessArgs = new core.WitnessArgs(new Reader(witness));
      const lock = witnessArgs.getLock();
      if (
        lock.hasValue() &&
        new Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock
      ) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.getInputType();
      if (inputType.hasValue()) {
        newWitnessArgs.input_type = new Reader(
          inputType.value().raw()
        ).serializeJson();
      }
      const outputType = witnessArgs.getOutputType();
      if (outputType.hasValue()) {
        newWitnessArgs.output_type = new Reader(
          outputType.value().raw()
        ).serializeJson();
      }
    }
    witness = new Reader(
      core.SerializeWitnessArgs(
        normalizers.NormalizeWitnessArgs(newWitnessArgs)
      )
    ).serializeJson();
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  const txFee = calculateTxFee(txSkeleton);
  changeCapacity = changeCapacity - txFee;

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.pop();
  });
  if (changeCapacity > BigInt(0)) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
  }

  return txSkeleton;
}

function getTransactionSize(txSkeleton: TransactionSkeletonType): number {
  const tx = createTransactionFromSkeleton(txSkeleton);
  return getTransactionSizeByTx(tx);
}

function getTransactionSizeByTx(tx: Transaction): number {
  const serializedTx = SerializeTransaction(
    normalizers.NormalizeTransaction(tx)
  );
  // 4 is serialized offset bytesize
  const size = serializedTx.byteLength + 4;
  return size;
}

function calculateFee(size: number, feeRate: bigint): bigint {
  const ratio = 1000n;
  const base = BigInt(size) * feeRate;
  const fee = base / ratio;
  if (fee * ratio < base) {
    return fee + 1n;
  }
  return fee;
}

function calculateTxFee(txSkeleton: TransactionSkeletonType): bigint {
  const feeRate = BigInt(1000);
  const txSize = getTransactionSize(txSkeleton);
  return calculateFee(txSize, feeRate);
}

function calculateCodeHashByBin(scriptBin: Uint8Array): string {
  const bin = scriptBin.valueOf();
  return new utils.CKBHasher()
    .update(bin.buffer.slice(bin.byteOffset, bin.byteLength + bin.byteOffset))
    .digestHex();
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

interface ScriptConfig {
  // if hash_type is type, code_hash is ckbHash(type_script)
  // if hash_type is data, code_hash is ckbHash(data)
  CODE_HASH: string;

  HASH_TYPE: "type" | "data";

  TX_HASH: string;
  // the deploy cell can be found at index of tx's outputs
  INDEX: string;

  // now deployWithX only supportted `code `
  DEP_TYPE: "dep_group" | "code";

  // empty
  SHORT_ID?: number;
}

function calculateTxHash(txSkeleton: TransactionSkeletonType): string {
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = utils
    .ckbHash(
      core.SerializeRawTransaction(normalizers.NormalizeRawTransaction(tx))
    )
    .serializeJson();
  return txHash;
}

function getScriptConfigByDataHash(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number
): ScriptConfig {
  const data = txSkeleton.outputs.get(outputIndex)!.data;
  const codeHash = utils
    .ckbHash(new Reader(data).toArrayBuffer())
    .serializeJson();
  const txHash = calculateTxHash(txSkeleton);
  const scriptConfig: ScriptConfig = {
    CODE_HASH: codeHash,
    HASH_TYPE: "data",
    TX_HASH: txHash,
    INDEX: "0x0",
    DEP_TYPE: "code",
  };
  return scriptConfig;
}

function getScriptConfigByTypeHash(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number
): ScriptConfig {
  const typeScript = txSkeleton.outputs.get(outputIndex)!.cell_output.type!;
  const codeHash = utils.computeScriptHash(typeScript);
  const txHash = calculateTxHash(txSkeleton);
  const scriptConfig: ScriptConfig = {
    CODE_HASH: codeHash,
    HASH_TYPE: "type",
    TX_HASH: txHash,
    INDEX: "0x0",
    DEP_TYPE: "code",
  };
  return scriptConfig;
}

function getScriptConfig(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number
): ScriptConfig {
  const outputCell = txSkeleton.outputs.get(outputIndex);
  if (outputCell == undefined)
    throw new Error("Invalid txSkeleton or outputIndex");
  const type = outputCell.cell_output.type;
  if (type !== undefined)
    return getScriptConfigByTypeHash(txSkeleton, outputIndex);
  return getScriptConfigByDataHash(txSkeleton, outputIndex);
}

function isMultisigFromInfo(fromInfo: FromInfo): fromInfo is MultisigScript {
  if (typeof fromInfo !== "object") return false;
  return (
    "M" in fromInfo &&
    "R" in fromInfo &&
    Array.isArray(fromInfo.publicKeyHashes)
  );
}

function verifyFromInfo(
  fromInfo: FromInfo,
  { config = undefined }: Options = {}
): void {
  config = config || getConfig();
  if (typeof fromInfo === "string") {
    if (
      helpers.nameOfScript(parseAddress(fromInfo, { config }), config.SCRIPTS) !== "SECP256K1_BLAKE160"
    )
      throw new Error(
        "only SECP256K1_BLAKE160 or SECP256K1_MULTISIG is supported"
      );
  } else if (!isMultisigFromInfo(fromInfo)) {
    throw new Error(
      "only SECP256K1_BLAKE160 or SECP256K1_MULTISIG is supported"
    );
  }
}

interface DeployOptions {
  cellProvider: CellProvider;
  scriptBinary: Uint8Array;
  fromInfo: FromInfo;
  config?: Config;
}

interface UpgradeOptions extends DeployOptions {
  typeId: Script;
}

interface DeployResult {
  txSkeleton: TransactionSkeletonType;
  scriptConfig: ScriptConfig;
}

interface TypeIDDeployResult extends DeployResult {
  typeId: Script;
}

/**
 * Generate txSkeleton for writing binary data to CKB, usually for deploying contracts.
 * This generator only supports `SECP256K1_BLAKE160` and `SECP256K1_BLAKE160_MULTISIG` currently.
 *
 * @param options
 */
export async function generateDeployWithDataTx(
  options: DeployOptions
): Promise<DeployResult> {
  verifyFromInfo(options.fromInfo, { config: options.config });

  let txSkeleton = TransactionSkeleton({ cellProvider: options.cellProvider });
  const { fromScript } = parseFromInfo(options.fromInfo, {
    config: options.config,
  });

  const output: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: fromScript,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = updateCellDeps(txSkeleton, options.config);
  txSkeleton = await completeTx(txSkeleton, options.fromInfo, options.config);

  const scriptConfig = getScriptConfig(txSkeleton, 0);

  return {
    txSkeleton,
    scriptConfig,
  };
}

/**
 * Generate txSkeleton for writing binary data to CKB via Type ID, usually for deploying contracts.
 * Deploying via Type ID makes it possible to upgrade contract, for more information about Type ID, please check: https://xuejie.space/2020_02_03_introduction_to_ckb_script_programming_type_id/
 * This generator only supports `SECP256K1_BLAKE160` and `SECP256K1_BLAKE160_MULTISIG` currently.
 *
 * @param options
 */
export async function generateDeployWithTypeIdTx(
  options: DeployOptions
): Promise<TypeIDDeployResult> {
  verifyFromInfo(options.fromInfo, { config: options.config });

  let txSkeleton = TransactionSkeleton({ cellProvider: options.cellProvider });
  const { fromScript } = parseFromInfo(options.fromInfo, {
    config: options.config,
  });

  const [resolved] = await findCellsByLock(fromScript, options.cellProvider);
  if (!resolved) throw new Error(`fromAddress has no live ckb`);

  const typeId = utils.generateTypeIdScript(
    { previous_output: resolved.out_point!, since: "0x0" },
    "0x0"
  );
  const output: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: fromScript,
      type: typeId,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = updateCellDeps(txSkeleton, options.config);
  txSkeleton = await completeTx(txSkeleton, options.fromInfo, options.config);

  const scriptConfig = getScriptConfig(txSkeleton, 0);

  return {
    txSkeleton,
    scriptConfig,
    typeId,
  };
}

export async function generateUpgradeTypeIdDataTx(
  options: UpgradeOptions
): Promise<DeployResult> {
  verifyFromInfo(options.fromInfo, { config: options.config });

  let txSkeleton = TransactionSkeleton({ cellProvider: options.cellProvider });
  const { fromScript } = parseFromInfo(options.fromInfo, {
    config: options.config,
  });

  const collector = options.cellProvider.collector({ type: options.typeId });
  const cells: Cell[] = [];
  for await (const cell of collector.collect()) {
    cells.push(cell);
  }
  if (cells.length !== 1) throw new Error("the typeid maybe wrong");

  const deployedCell = cells[0];
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(deployedCell);
  });

  const output: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: fromScript,
      type: options.typeId,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = updateCellDeps(txSkeleton, options.config);
  txSkeleton = await completeTx(txSkeleton, options.fromInfo, options.config);

  const scriptConfig = getScriptConfig(txSkeleton, 0);

  return {
    txSkeleton,
    scriptConfig,
  };
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

export default {
  generateDeployWithDataTx,
  generateDeployWithTypeIdTx,
  generateUpgradeTypeIdDataTx,
  compareScriptBinaryWithOnChainData,
  __tests__: {
    calculateTxFee,
  },
};
