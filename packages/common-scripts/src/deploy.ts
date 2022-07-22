import {
  Script,
  OutPoint,
  CellProvider,
  Cell,
  utils,
  values,
  WitnessArgs,
  Transaction,
} from "@ckb-lumos/base";
import { blockchain, blockchainUtils, bytes } from "@ckb-lumos/codec";
import { getConfig, Config, helpers } from "@ckb-lumos/config-manager";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
  Options,
  createTransactionFromSkeleton,
  parseAddress,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import { Set } from "immutable";
import { FromInfo, parseFromInfo, MultisigScript } from "./from_info";
import { BI, BIish } from "@ckb-lumos/bi";
import RPC from "@ckb-lumos/rpc";
const { ScriptValue } = values;

function bytesToHex(bytes: Uint8Array): string {
  let res = "0x";
  for (let i = 0; i < bytes.length; i++) {
    res += bytes[i].toString(16).padStart(2, "0");
  }
  return res;
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
  const cellCapacity = minimalCellCapacityCompatible(output);
  output.cellOutput.capacity = `0x${cellCapacity.toString(16)}`;
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
        outPoint: {
          txHash: secp256k1Config.TX_HASH,
          index: secp256k1Config.INDEX,
        },
        depType: secp256k1Config.DEP_TYPE,
      },
      // TODO: optimize me, push dep directly without checking actual locks used would cause bigger tx
      {
        outPoint: {
          txHash: secp256k1MultiSigConfig.TX_HASH,
          index: secp256k1MultiSigConfig.INDEX,
        },
        depType: secp256k1MultiSigConfig.DEP_TYPE,
      }
    );
  });

  return txSkeleton;
}

async function completeTx(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  config?: Config,
  feeRate?: BIish
): Promise<TransactionSkeletonType> {
  const inputCapacity = txSkeleton
    .get("inputs")
    .map((c) => BI.from(c.cellOutput.capacity))
    .reduce((a, b) => a.add(b), BI.from(0));
  const outputCapacity = txSkeleton
    .get("outputs")
    .map((c) => BI.from(c.cellOutput.capacity))
    .reduce((a, b) => a.add(b), BI.from(0));
  const needCapacity = outputCapacity.sub(inputCapacity);
  txSkeleton = await injectCapacity(
    txSkeleton,
    fromInfo,
    BI.from(needCapacity),
    {
      config: config,
      feeRate: feeRate,
    }
  );
  return txSkeleton;
}

async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  amount: BIish,
  {
    config = undefined,
    feeRate = undefined,
  }: { config?: Config; feeRate?: BIish }
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  const _feeRate = feeRate || 1000;
  let _amount = BI.from(amount);
  const { fromScript, multisigScript } = parseFromInfo(fromInfo, { config });
  _amount = _amount.add(BI.from(10).pow(8));
  let changeCapacity = BI.from(10).pow(8);
  const changeCell: Cell = {
    cellOutput: {
      capacity: "0x0",
      lock: fromScript,
      type: undefined,
    },
    data: "0x",
  };
  const minimalChangeCapacity: BI = BI.from(
    minimalCellCapacityCompatible(changeCell)
  ).add(BI.from(10).pow(8));

  if (_amount.lt(0)) {
    changeCapacity = changeCapacity.sub(_amount);
    _amount = BI.from(0);
  }
  if (_amount.gt(0) || changeCapacity.lt(minimalChangeCapacity)) {
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
        `${input.outPoint!.txHash}_${input.outPoint!.index}`
      );
    }

    for await (const inputCell of cellCollector.collect()) {
      if (
        previousInputs.has(
          `${inputCell.outPoint!.txHash}_${inputCell.outPoint!.index}`
        )
      )
        continue;
      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(inputCell)
      );
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
      const inputCapacity = BI.from(inputCell.cellOutput.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity.gt(_amount)) {
        deductCapacity = _amount;
      }
      _amount = _amount.sub(deductCapacity);
      changeCapacity = changeCapacity.add(inputCapacity).sub(deductCapacity);
      if (
        _amount.eq(0) &&
        (changeCapacity.eq(0) || changeCapacity.gte(minimalChangeCapacity))
      )
        break;
    }
  }

  if (changeCapacity.gt(0)) {
    changeCell.cellOutput.capacity = "0x" + changeCapacity.toString(16);
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
  }
  if (_amount.gt(0) || changeCapacity.lt(minimalChangeCapacity))
    throw new Error("Not enough capacity in from address!");

  /*
   * Modify the skeleton, so the first witness of the fromAddress script group
   * has a WitnessArgs construct with 65-byte zero filled values. While this
   * is not required, it helps in transaction fee estimation.
   */
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
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
      const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
      const lock = witnessArgs.lock;
      if (!!lock && lock !== newWitnessArgs.lock) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.inputType;
      if (!!inputType) {
        newWitnessArgs.inputType = inputType;
      }
      const outputType = witnessArgs.outputType;
      if (!!outputType) {
        newWitnessArgs.outputType = outputType;
      }
    }
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }

  const txFee = calculateTxFee(txSkeleton, _feeRate);
  changeCapacity = changeCapacity.sub(txFee);

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.pop();
  });
  if (changeCapacity.gt(0)) {
    changeCell.cellOutput.capacity = "0x" + changeCapacity.toString(16);
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
  const serializedTx = blockchain.Transaction.pack(
    blockchainUtils.transformTransactionCodecType(tx)
  );
  // 4 is serialized offset bytesize
  const size = serializedTx.byteLength + 4;
  return size;
}

function calculateFee(size: number, feeRate: BIish): BI {
  const ratio = BI.from(1000);
  const base = BI.from(size).mul(feeRate);
  const fee = base.div(ratio);

  if (fee.mul(ratio).lt(base)) {
    return fee.add(1);
  }
  return BI.from(fee);
}

function calculateTxFee(
  txSkeleton: TransactionSkeletonType,
  feeRate: BIish
): BI {
  const txSize = getTransactionSize(txSkeleton);
  return BI.from(calculateFee(txSize, feeRate));
}

function calculateCodeHashByBin(scriptBin: Uint8Array): string {
  const bin = scriptBin.valueOf();
  return new utils.CKBHasher()
    .update(bin.buffer.slice(bin.byteOffset, bin.byteLength + bin.byteOffset))
    .digestHex();
}

async function getDataHash(outPoint: OutPoint, rpc: RPC): Promise<string> {
  const txHash = outPoint.txHash;
  const index = parseInt(outPoint.index, 10);
  const tx = await rpc.getTransaction(txHash);

  if (!tx) throw new Error(`TxHash(${txHash}) is not found`);

  const outputData = tx.transaction.outputsData[index];
  if (!outputData) throw new Error(`cannot find output data`);

  return new utils.CKBHasher().update(bytes.bytify(outputData)).digestHex();
}

interface ScriptConfig {
  // if hashType is type, codeHash is ckbHash(type_script)
  // if hashType is data, codeHash is ckbHash(data)
  CODE_HASH: string;

  HASH_TYPE: "type" | "data";

  TX_HASH: string;
  // the deploy cell can be found at index of tx's outputs
  INDEX: string;

  // now deployWithX only supportted `code `
  DEP_TYPE: "depGroup" | "code";

  // empty
  SHORT_ID?: number;
}

function calculateTxHash(txSkeleton: TransactionSkeletonType): string {
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = utils.ckbHash(
    blockchain.Transaction.pack(
      blockchainUtils.transformTransactionCodecType(tx)
    )
  );
  return txHash;
}

function getScriptConfigByDataHash(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number
): ScriptConfig {
  const data = txSkeleton.outputs.get(outputIndex)!.data;
  const codeHash = utils.ckbHash(bytes.bytify(data));
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
  const typeScript = txSkeleton.outputs.get(outputIndex)!.cellOutput.type!;
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
  const type = outputCell.cellOutput.type;
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
      helpers.nameOfScript(
        parseAddress(fromInfo, { config }),
        config.SCRIPTS
      ) !== "SECP256K1_BLAKE160"
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
  feeRate?: bigint;
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
    cellOutput: {
      capacity: "0x0",
      lock: fromScript,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = updateCellDeps(txSkeleton, options.config);
  txSkeleton = await completeTx(
    txSkeleton,
    options.fromInfo,
    options.config,
    options.feeRate
  );

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
    { previousOutput: resolved.outPoint!, since: "0x0" },
    "0x0"
  );
  const output: Cell = {
    cellOutput: {
      capacity: "0x0",
      lock: fromScript,
      type: typeId,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = updateCellDeps(txSkeleton, options.config);
  txSkeleton = await completeTx(
    txSkeleton,
    options.fromInfo,
    options.config,
    options.feeRate
  );

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
    cellOutput: {
      capacity: "0x0",
      lock: fromScript,
      type: options.typeId,
    },
    data: bytesToHex(options.scriptBinary),
  };

  txSkeleton = updateOutputs(txSkeleton, output);
  txSkeleton = updateCellDeps(txSkeleton, options.config);
  txSkeleton = await completeTx(
    txSkeleton,
    options.fromInfo,
    options.config,
    options.feeRate
  );

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
