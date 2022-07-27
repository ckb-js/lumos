import { Set } from "immutable";
import { parseAddress, minimalCellCapacityCompatible, TransactionSkeletonType, Options } from "@ckb-lumos/helpers";
import { blockchain, bytes } from "@ckb-lumos/codec";
import {
  values,
  Address,
  Cell,
  WitnessArgs,
  CellCollector as CellCollectorType,
  Script,
  CellProvider,
  QueryOptions,
  OutPoint,
  HexString,
  PackedSince,
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import {
  addCellDep,
  ensureScript,
  prepareSigningEntries as _prepareSigningEntries,
  SECP_SIGNATURE_PLACEHOLDER,
  isSecp256k1Blake160Script,
} from "./helper";
import { FromInfo } from ".";
import { parseFromInfo } from "./from_info";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";
const { ScriptValue } = values;

export const CellCollector: CellCollectorConstructor = class CellCollector implements CellCollectorType {
  private cellCollector: CellCollectorType;
  private config: Config;
  public readonly fromScript: Script;

  constructor(
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config = undefined,
      queryOptions = {},
    }: Options & {
      queryOptions?: QueryOptions;
    } = {}
  ) {
    if (!cellProvider) {
      throw new Error(`Cell provider is missing!`);
    }
    config = config || getConfig();
    this.fromScript = parseFromInfo(fromInfo, { config }).fromScript;

    this.config = config;

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    if (!isSecp256k1Blake160Script(this.fromScript, this.config)) {
      return;
    }

    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
};

/**
 * Setup input cell infos, such as cell deps and witnesses.
 *
 * @param txSkeleton
 * @param inputCell
 * @param _fromInfo
 * @param options
 */
export async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  _fromInfo?: FromInfo,
  {
    config = undefined,
    defaultWitness = "0x",
    since = undefined,
  }: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  const fromScript = inputCell.cellOutput.lock;
  if (!isSecp256k1Blake160Script(fromScript, config)) {
    throw new Error(`Not SECP256K1_BLAKE160 input!`);
  }

  // add inputCell to txSkeleton
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(inputCell);
  });

  const output: Cell = {
    cellOutput: {
      capacity: inputCell.cellOutput.capacity,
      lock: inputCell.cellOutput.lock,
      type: inputCell.cellOutput.type,
    },
    data: inputCell.data,
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  if (since) {
    txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
      return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
    });
  }

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push(defaultWitness);
  });

  const template = config.SCRIPTS.SECP256K1_BLAKE160;
  if (!template) {
    throw new Error(`SECP256K1_BLAKE160 script not defined in config!`);
  }

  const scriptOutPoint: OutPoint = {
    txHash: template.TX_HASH,
    index: template.INDEX,
  };

  // add cell dep
  txSkeleton = addCellDep(txSkeleton, {
    outPoint: scriptOutPoint,
    depType: template.DEP_TYPE,
  });

  // add witness
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
      txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock: SECP_SIGNATURE_PLACEHOLDER,
    };
    if (witness !== "0x") {
      const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
      const lock = witnessArgs.lock;
      if (!!lock && lock !== newWitnessArgs.lock) {
        throw new Error("Lock field in first witness is set aside for signature!");
      }
      const inputType = witnessArgs.inputType;
      if (inputType) {
        newWitnessArgs.inputType = inputType;
      }
      const outputType = witnessArgs.outputType;
      if (outputType) {
        newWitnessArgs.outputType = outputType;
      }
    }
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
  }

  return txSkeleton;
}

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address | null | undefined,
  amount: bigint,
  options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
  }
): Promise<TransactionSkeletonType>;

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address | null | undefined,
  amount: bigint,
  options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
  }
): Promise<[TransactionSkeletonType, bigint]>;

/**
 * transfer capacity from secp256k1_blake160 script cells
 *
 * @param txSkeleton
 * @param fromAddress
 * @param toAddress
 * @param amount
 * @param options
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address | null | undefined,
  amount: bigint,
  {
    config = undefined,
    requireToAddress = true,
    assertAmountEnough = true,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: boolean;
  } = {}
): Promise<TransactionSkeletonType | [TransactionSkeletonType, bigint]> {
  const result = await transferCompatible(txSkeleton, fromAddress, toAddress, amount, {
    config,
    requireToAddress,
    assertAmountEnough: assertAmountEnough as true | undefined,
  });
  let _txSkeleton: TransactionSkeletonType;
  let _amount: bigint;
  if (result instanceof Array) {
    _txSkeleton = result[0];
    _amount = BigInt(result[1].toString());
    return [_txSkeleton, _amount];
  } else {
    _txSkeleton = result;
    return _txSkeleton;
  }
}
export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address | null | undefined,
  amount: BIish,
  options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
  }
): Promise<TransactionSkeletonType>;

export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address | null | undefined,
  amount: BIish,
  options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
  }
): Promise<[TransactionSkeletonType, BI]>;
/**
 * transfer capacity from secp256k1_blake160 script cells
 *
 * @param txSkeleton
 * @param fromAddress
 * @param toAddress
 * @param amount
 * @param options
 */
export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address | null | undefined,
  amount: BIish,
  {
    config = undefined,
    requireToAddress = true,
    assertAmountEnough = true,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: boolean;
  } = {}
): Promise<TransactionSkeletonType | [TransactionSkeletonType, BI]> {
  config = config || getConfig();

  const template = config.SCRIPTS.SECP256K1_BLAKE160;
  if (!template) {
    throw new Error("Provided config does not have SECP256K1_BLAKE160 script setup!");
  }
  const scriptOutPoint = {
    txHash: template.TX_HASH,
    index: template.INDEX,
  };

  txSkeleton = addCellDep(txSkeleton, {
    outPoint: scriptOutPoint,
    depType: template.DEP_TYPE,
  });

  const fromScript = parseAddress(fromAddress, { config });
  ensureScript(fromScript, config, "SECP256K1_BLAKE160");

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  let _amount = BI.from(amount);
  if (toAddress) {
    const toScript = parseAddress(toAddress, { config });

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: "0x" + _amount.toString(16),
          lock: toScript,
          type: undefined,
        },
        data: "0x",
        outPoint: undefined,
        blockHash: undefined,
      });
    });
  }

  /*
   * First, check if there is any output cells that contains enough capacity
   * for us to tinker with.
   *
   * TODO: the solution right now won't cover all cases, some outputs before the
   * last output might still be tinkerable, right now we are working on the
   * simple solution, later we can change this for more optimizations.
   */
  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && _amount.gt(0); i++) {
    const output = txSkeleton.get("outputs").get(i)!;
    if (
      new ScriptValue(output.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const cellCapacity = BI.from(output.cellOutput.capacity);
      let deductCapacity;
      if (_amount.gte(cellCapacity)) {
        deductCapacity = cellCapacity;
      } else {
        deductCapacity = cellCapacity.sub(minimalCellCapacityCompatible(output));
        if (deductCapacity.gt(_amount)) {
          deductCapacity = _amount;
        }
      }
      _amount = _amount.sub(deductCapacity);
      output.cellOutput.capacity = "0x" + cellCapacity.sub(deductCapacity).toString(16);
    }
  }
  // Remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter((output) => !BI.from(output.cellOutput.capacity).eq(0));
  });
  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  if (_amount.gt(0)) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("Cell provider is missing!");
    }
    const cellCollector = cellProvider.collector({
      lock: fromScript,
    });
    const changeCell: Cell = {
      cellOutput: {
        capacity: "0x0",
        lock: fromScript,
        type: undefined,
      },
      data: "0x",
      outPoint: undefined,
      blockHash: undefined,
    };
    let changeCapacity = BI.from(0);
    let previousInputs = Set<string>();
    for (const input of txSkeleton.get("inputs")) {
      previousInputs = previousInputs.add(`${input.outPoint!.txHash}_${input.outPoint!.index}`);
    }
    for await (const inputCell of cellCollector.collect()) {
      // skip inputs already exists in txSkeleton.inputs
      if (previousInputs.has(`${inputCell.outPoint!.txHash}_${inputCell.outPoint!.index}`)) {
        continue;
      }
      txSkeleton = txSkeleton.update("inputs", (inputs) => inputs.push(inputCell));
      txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
      const inputCapacity = BI.from(inputCell.cellOutput.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity.gt(_amount)) {
        deductCapacity = _amount;
      }
      _amount = _amount.sub(deductCapacity);
      changeCapacity = changeCapacity.add(inputCapacity).sub(deductCapacity);
      if (_amount.eq(0) && (changeCapacity.eq(0) || changeCapacity.gt(minimalCellCapacityCompatible(changeCell)))) {
        break;
      }
    }
    if (changeCapacity.gt(0)) {
      changeCell.cellOutput.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) => outputs.push(changeCell));
    }
  }
  if (_amount.gt(0) && assertAmountEnough) {
    throw new Error("Not enough capacity in from address!");
  }
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
      txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.push("0x"));
    }
    let witness: string = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock: SECP_SIGNATURE_PLACEHOLDER,
    };
    if (witness !== "0x") {
      const witnessArgs = blockchain.WitnessArgs.unpack(bytes.bytify(witness));
      const lock = witnessArgs.lock;
      if (!!lock && lock !== newWitnessArgs.lock) {
        throw new Error("Lock field in first witness is set aside for signature!");
      }
      const inputType = witnessArgs.inputType;
      if (inputType) {
        newWitnessArgs.inputType = inputType;
      }
      const outputType = witnessArgs.outputType;
      if (outputType) {
        newWitnessArgs.outputType = outputType;
      }
    }
    witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => witnesses.set(firstIndex, witness));
  }
  if (!assertAmountEnough) {
    return [txSkeleton, BI.from(_amount)];
  }
  return txSkeleton;
}

/**
 * pay fee by secp256k1_blake160 script cells
 *
 * @param txSkeleton
 * @param fromAddress
 * @param amount fee in shannon
 * @param options
 */
export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  amount: BIish,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  return await transferCompatible(txSkeleton, fromAddress, null, amount, {
    config,
    requireToAddress: false,
  });
}

/**
 * Inject capacity from `fromAddress` to target output.
 *
 * @param txSkeleton
 * @param outputIndex
 * @param fromAddress
 * @param options
 */
export async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number,
  fromAddress: Address,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BI.from(txSkeleton.get("outputs").get(outputIndex)!.cellOutput.capacity);
  return await transferCompatible(txSkeleton, fromAddress, null, BI.from(capacity), {
    config,
    requireToAddress: false,
  });
}

/**
 * prepare for txSkeleton signingEntries, will update txSkeleton.get("signingEntries")
 *
 * @param txSkeleton
 * @param options
 */
export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();

  return _prepareSigningEntries(txSkeleton, config, "SECP256K1_BLAKE160");
}

export default {
  transfer,
  transferCompatible,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
  CellCollector,
};
