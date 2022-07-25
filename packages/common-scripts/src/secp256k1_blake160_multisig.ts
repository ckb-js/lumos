import {
  parseAddress,
  TransactionSkeletonType,
  Options,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import { blockchain, bytes } from "@ckb-lumos/codec";
import {
  values,
  HexString,
  Script,
  Address,
  OutPoint,
  Cell,
  WitnessArgs,
  CellCollector as CellCollectorType,
  CellProvider,
  QueryOptions,
  PackedSince,
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
const { ScriptValue } = values;
import { Set } from "immutable";
import {
  addCellDep,
  ensureScript,
  SECP_SIGNATURE_PLACEHOLDER,
  prepareSigningEntries as _prepareSigningEntries,
  isSecp256k1Blake160MultisigScript,
} from "./helper";
import {
  FromInfo,
  parseFromInfo,
  MultisigScript,
  serializeMultisigScript,
  multisigArgs,
} from "./from_info";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";

export { serializeMultisigScript, multisigArgs };

export const CellCollector: CellCollectorConstructor = class CellCollector
  implements CellCollectorType {
  private cellCollector: CellCollectorType;
  private config: Config;
  public readonly fromScript: Script;
  public readonly multisigScript?: HexString;

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
    const result = parseFromInfo(fromInfo, { config });
    this.fromScript = result.fromScript;
    this.multisigScript = result.multisigScript;

    this.config = config;

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    if (!isSecp256k1Blake160MultisigScript(this.fromScript, this.config)) {
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
 * @param fromInfo
 * @param options
 */
export async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  fromInfo?: FromInfo,
  {
    config = undefined,
    defaultWitness = "0x",
    since = undefined,
    requireMultisigScript = true,
  }: Options & {
    defaultWitness?: HexString;
    requireMultisigScript?: boolean;
    since?: PackedSince;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  if (requireMultisigScript && typeof fromInfo !== "object") {
    throw new Error("`fromInfo` must be MultisigScript format!");
  }

  const fromScript: Script = inputCell.cellOutput.lock;

  if (fromInfo) {
    const parsedFromScript: Script = parseFromInfo(fromInfo, { config })
      .fromScript;
    if (
      !new ScriptValue(parsedFromScript, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      throw new Error("`fromInfo` not match to input lock!");
    }
  }

  if (!isSecp256k1Blake160MultisigScript(fromScript, config)) {
    throw new Error(`Not SECP256K1_BLAKE160_MULTISIG input!`);
  }

  // add inputCell to txSkeleton
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(inputCell);
  });

  if (since) {
    txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
      return inputSinces.set(txSkeleton.get("inputs").size - 1, since);
    });
  }

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push(defaultWitness);
  });

  const outputCell: Cell = {
    cellOutput: {
      capacity: inputCell.cellOutput.capacity,
      lock: inputCell.cellOutput.lock,
      type: inputCell.cellOutput.type,
    },
    data: inputCell.data,
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(outputCell);
  });

  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  if (!template) {
    throw new Error(
      `SECP256K1_BLAKE160_MULTISIG script not defined in config!`
    );
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
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript!, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }

    const firstIndexWitness = txSkeleton.get("witnesses").get(firstIndex)!;
    // If never prepared witness of this lock script before, should using fromInfo(MultisigScript) to update witness
    if (firstIndexWitness === "0x" && typeof fromInfo !== "object") {
      throw new Error("`fromInfo` must be MultisigScript format!");
    }

    // if using MultisigScript, check witnesses
    if (typeof fromInfo === "object") {
      const multisigScript: HexString = parseFromInfo(fromInfo, { config })
        .multisigScript!;
      let witness = txSkeleton.get("witnesses").get(firstIndex)!;
      const newWitnessArgs: WitnessArgs = {
        lock:
          "0x" +
          multisigScript.slice(2) +
          SECP_SIGNATURE_PLACEHOLDER.slice(2).repeat(
            (fromInfo as MultisigScript).M
          ),
      };
      if (witness !== "0x") {
        const witnessArgs = blockchain.WitnessArgs.unpack(
          bytes.bytify(witness)
        );
        const lock = witnessArgs.lock;
        if (!!lock && lock !== newWitnessArgs.lock) {
          throw new Error(
            "Lock field in first witness is set aside for signature!"
          );
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
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.set(firstIndex, witness)
      );
    }
  }

  return txSkeleton;
}

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: bigint,
  options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
  }
): Promise<TransactionSkeletonType>;

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: bigint,
  options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
  }
): Promise<[TransactionSkeletonType, bigint]>;

/**
 * transfer capacity from multisig script cells
 *
 * @param txSkeleton
 * @param fromInfo fromAddress or fromMultisigScript, if this address new to txSkeleton inputs, must use fromMultisigScript
 * @param toAddress
 * @param amount transfer CKB capacity in shannon.
 * @param options
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
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
  const result = await transferCompatible(
    txSkeleton,
    fromInfo,
    toAddress,
    amount,
    {
      config,
      requireToAddress,
      assertAmountEnough: assertAmountEnough as true | undefined,
    }
  );
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
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: BIish,
  options?: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
  }
): Promise<TransactionSkeletonType>;

export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: BIish,
  options: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
  }
): Promise<[TransactionSkeletonType, BI]>;

export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
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
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  if (!template) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE16_MULTISIG script setup!"
    );
  }
  const scriptOutPoint: OutPoint = {
    txHash: template.TX_HASH,
    index: template.INDEX,
  };

  txSkeleton = addCellDep(txSkeleton, {
    outPoint: scriptOutPoint,
    depType: template.DEP_TYPE,
  });

  const { fromScript, multisigScript } = parseFromInfo(fromInfo, { config });

  ensureScript(fromScript, config, "SECP256K1_BLAKE160_MULTISIG");

  const noMultisigBefore = !txSkeleton.get("inputs").find((i) => {
    return new ScriptValue(i.cellOutput.lock, { validate: false }).equals(
      new ScriptValue(fromScript!, { validate: false })
    );
  });

  if (noMultisigBefore && fromInfo === "string") {
    throw new Error("MultisigScript is required for witness!");
  }

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  let _amount = amount ? BI.from(amount) : BI.from(0);
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

  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && _amount.gt(0); ++i) {
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
        deductCapacity = cellCapacity.sub(
          minimalCellCapacityCompatible(output)
        );
        if (deductCapacity.gt(_amount)) {
          deductCapacity = _amount;
        }
      }
      _amount = _amount.sub(deductCapacity);
      output.cellOutput.capacity =
        "0x" + cellCapacity.sub(deductCapacity).toString(16);
    }
  }
  // remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) => !BI.from(output.cellOutput.capacity).eq(0)
    );
  });
  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  if (_amount.gt(0)) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }
    // TODO: ignore locktime now.
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
      previousInputs = previousInputs.add(
        `${input.outPoint!.txHash}_${input.outPoint!.index}`
      );
    }
    for await (const inputCell of cellCollector.collect()) {
      // skip inputs already exists in txSkeleton.inputs
      if (
        previousInputs.has(
          `${inputCell.outPoint!.txHash}_${inputCell.outPoint!.index}`
        )
      ) {
        continue;
      }
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
      changeCapacity = changeCapacity.add(inputCapacity.sub(deductCapacity));
      if (
        _amount.eq(0) &&
        (changeCapacity.eq(0) ||
          changeCapacity.gt(minimalCellCapacityCompatible(changeCell)))
      ) {
        break;
      }
    }
    if (changeCapacity.gt(0)) {
      changeCell.cellOutput.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(changeCell)
      );
    }
  }
  if (_amount.gt(0) && assertAmountEnough) {
    throw new Error("Not enough capacity in from address!");
  }

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript!, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (BI.from(firstIndex).gte(txSkeleton.get("witnesses").size)) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }

    // if using MultisigScript, check witnesses
    if (noMultisigBefore || typeof fromInfo !== "string") {
      let witness = txSkeleton.get("witnesses").get(firstIndex)!;
      const newWitnessArgs: WitnessArgs = {
        lock:
          "0x" +
          multisigScript!.slice(2) +
          SECP_SIGNATURE_PLACEHOLDER.slice(2).repeat(
            (fromInfo as MultisigScript).M
          ),
      };
      if (witness !== "0x") {
        const witnessArgs = blockchain.WitnessArgs.unpack(
          bytes.bytify(witness)
        );
        const lock = witnessArgs.lock;
        if (!!lock && lock !== newWitnessArgs.lock) {
          throw new Error(
            "Lock field in first witness is set aside for signature!"
          );
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
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.set(firstIndex, witness)
      );
    }
  }
  if (!assertAmountEnough) {
    return [txSkeleton, BI.from(_amount)];
  }
  return txSkeleton;
}

/**
 * pay fee by multisig script cells
 *
 * @param txSkeleton
 * @param fromInfo
 * @param amount fee in shannon
 * @param options
 */
export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  amount: BIish,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  return transferCompatible(txSkeleton, fromInfo, undefined, amount, {
    config,
    requireToAddress: false,
  });
}

/**
 * Inject capacity from `fromInfo` to target output.
 *
 * @param txSkeleton
 * @param outputIndex
 * @param fromInfo
 * @param options
 */
export async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number,
  fromInfo: FromInfo,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BI.from(
    txSkeleton.get("outputs").get(outputIndex)!.cellOutput.capacity
  );
  return transferCompatible(txSkeleton, fromInfo, undefined, capacity, {
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

  return _prepareSigningEntries(
    txSkeleton,
    config,
    "SECP256K1_BLAKE160_MULTISIG"
  );
}

export default {
  transfer,
  transferCompatible,
  payFee,
  prepareSigningEntries,
  serializeMultisigScript,
  multisigArgs,
  injectCapacity,
  setupInputCell,
  CellCollector,
};
