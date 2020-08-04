import {
  parseAddress,
  minimalCellCapacity,
  TransactionSkeletonType,
  Options,
} from "@ckb-lumos/helpers";
import {
  core,
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
import { normalizers, Reader } from "ckb-js-toolkit";
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

export { serializeMultisigScript, multisigArgs };

export class CellCollector implements CellCollectorType {
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
}

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
    needCapacity?: HexString;
  } = {}
): Promise<{
  txSkeleton: TransactionSkeletonType;
  usedCapacity: HexString;
}> {
  config = config || getConfig();

  if (requireMultisigScript && typeof fromInfo !== "object") {
    throw new Error("`fromInfo` must be MultisigScript format!");
  }

  const fromScript: Script = inputCell.cell_output.lock;

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
  const usedCapacity: HexString = inputCell.cell_output.capacity;

  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  if (!template) {
    throw new Error(
      `SECP256K1_BLAKE160_MULTISIG script not defined in config!`
    );
  }

  const scriptOutPoint: OutPoint = {
    tx_hash: template.TX_HASH,
    index: template.INDEX,
  };

  // add cell dep
  txSkeleton = addCellDep(txSkeleton, {
    out_point: scriptOutPoint,
    dep_type: template.DEP_TYPE,
  });

  // add witness
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
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
  }

  return {
    txSkeleton,
    usedCapacity,
  };
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
  config = config || getConfig();
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  if (!template) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE16_MULTISIG script setup!"
    );
  }
  const scriptOutPoint: OutPoint = {
    tx_hash: template.TX_HASH,
    index: template.INDEX,
  };

  txSkeleton = addCellDep(txSkeleton, {
    out_point: scriptOutPoint,
    dep_type: template.DEP_TYPE,
  });

  const { fromScript, multisigScript } = parseFromInfo(fromInfo, { config });

  ensureScript(fromScript, config, "SECP256K1_BLAKE160_MULTISIG");

  const noMultisigBefore = !txSkeleton.get("inputs").find((i) => {
    return new ScriptValue(i.cell_output.lock, { validate: false }).equals(
      new ScriptValue(fromScript!, { validate: false })
    );
  });

  if (noMultisigBefore && fromInfo === "string") {
    throw new Error("MultisigScript is required for witness!");
  }

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  amount = BigInt(amount || 0);
  if (toAddress) {
    const toScript = parseAddress(toAddress, { config });

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push({
        cell_output: {
          capacity: "0x" + amount.toString(16),
          lock: toScript,
          type: undefined,
        },
        data: "0x",
        out_point: undefined,
        block_hash: undefined,
      });
    });
  }

  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && amount > 0; ++i) {
    const output = txSkeleton.get("outputs").get(i)!;
    if (
      new ScriptValue(output.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const cellCapacity = BigInt(output.cell_output.capacity);
      let deductCapacity;
      if (amount >= cellCapacity) {
        deductCapacity = cellCapacity;
      } else {
        deductCapacity = cellCapacity - minimalCellCapacity(output);
        if (deductCapacity > amount) {
          deductCapacity = amount;
        }
      }
      amount -= deductCapacity;
      output.cell_output.capacity =
        "0x" + (cellCapacity - deductCapacity).toString(16);
    }
  }
  // remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) => BigInt(output.cell_output.capacity) !== BigInt(0)
    );
  });
  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  if (amount > 0n) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }
    // TODO: ignore locktime now.
    const cellCollector = cellProvider.collector({
      lock: fromScript,
    });
    const changeCell: Cell = {
      cell_output: {
        capacity: "0x0",
        lock: fromScript,
        type: undefined,
      },
      data: "0x",
      out_point: undefined,
      block_hash: undefined,
    };
    let changeCapacity = BigInt(0);
    let previousInputs = Set<string>();
    for (const input of txSkeleton.get("inputs")) {
      previousInputs = previousInputs.add(
        `${input.out_point!.tx_hash}_${input.out_point!.index}`
      );
    }
    for await (const inputCell of cellCollector.collect()) {
      // skip inputs already exists in txSkeleton.inputs
      if (
        previousInputs.has(
          `${inputCell.out_point!.tx_hash}_${inputCell.out_point!.index}`
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
          changeCapacity > minimalCellCapacity(changeCell))
      ) {
        break;
      }
    }
    if (changeCapacity > BigInt(0)) {
      changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(changeCell)
      );
    }
  }
  if (amount > 0 && assertAmountEnough) {
    throw new Error("Not enough capacity in from address!");
  }

  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript!, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
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
  }
  if (!assertAmountEnough) {
    return [txSkeleton, amount];
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
  amount: bigint,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  return transfer(txSkeleton, fromInfo, undefined, amount, {
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
  const capacity = BigInt(
    txSkeleton.get("outputs").get(outputIndex)!.cell_output.capacity
  );
  return transfer(txSkeleton, fromInfo, undefined, capacity, {
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
  payFee,
  prepareSigningEntries,
  serializeMultisigScript,
  multisigArgs,
  injectCapacity,
  setupInputCell,
  CellCollector,
};
