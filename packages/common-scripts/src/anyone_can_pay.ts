import {
  TransactionSkeletonType,
  Options,
  parseAddress,
  minimalCellCapacity,
  createTransactionFromSkeleton,
} from "@ckb-lumos/helpers";
import {
  values,
  Address,
  Script,
  QueryOptions,
  CellProvider,
  CellCollector as CellCollectorType,
  OutPoint,
  HexString,
  WitnessArgs,
  core,
  Cell,
  utils,
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import {
  isAcpScript,
  addCellDep,
  SECP_SIGNATURE_PLACEHOLDER,
  hashWitness,
  isAcpAddress,
} from "./helper";
import { Reader, normalizers } from "ckb-js-toolkit";
const { ScriptValue } = values;
import { Set, List } from "immutable";
const { CKBHasher, ckbHash, readBigUInt128LE } = utils;

export class CellCollector {
  private cellCollector: CellCollectorType;
  private config: Config;
  public readonly fromScript: Script;

  constructor(
    fromAddress: Address,
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
    this.fromScript = parseAddress(fromAddress, { config });

    this.config = config;

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    if (!isAcpScript(this.fromScript, this.config)) {
      return;
    }
    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
}

export async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputIndex: number,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  if (inputIndex >= txSkeleton.get("inputs").size) {
    throw new Error("Invalid input index!");
  }
  const input = txSkeleton.get("inputs").get(inputIndex)!;
  const inputLock = input.cell_output.lock;

  if (!isAcpScript(inputLock, config)) {
    throw new Error("Not anyone-can-pay input!");
  }

  const template = config.SCRIPTS.ANYONE_CAN_PAY;
  if (!template) {
    throw new Error(`ANYONE_CAN_PAY script not defined in config!`);
  }

  const scriptOutPoint: OutPoint = {
    tx_hash: template.TX_HASH,
    index: template.INDEX,
  };

  // add cell_dep
  txSkeleton = addCellDep(txSkeleton, {
    out_point: scriptOutPoint,
    dep_type: template.DEP_TYPE,
  });

  // add witness
  const firstIndex = txSkeleton.get("inputs").findIndex((input) => {
    return new ScriptValue(input.cell_output.lock, { validate: false }).equals(
      new ScriptValue(inputLock, { validate: false })
    );
  });
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
        return witnesses.push("0x");
      });
    }
    let witness: HexString = txSkeleton.get("witnesses").get(firstIndex)!;
    const newWitnessArgs: WitnessArgs = {
      /* 65-byte zeros in hex */
      lock: SECP_SIGNATURE_PLACEHOLDER,
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
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
      return witnesses.set(firstIndex, witness);
    });
  }

  return txSkeleton;
}

export async function injectCapacity(
  cellCollector: CellCollector,
  txSkeleton: TransactionSkeletonType,
  outputIndex: number,
  capacity: bigint,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error(`Invalid output index!`);
  }

  capacity = BigInt(capacity);

  const template = config.SCRIPTS.ANYONE_CAN_PAY;
  if (!template) {
    throw new Error(
      `Provided config does not have ANYONE_CAN_PAY script setup!`
    );
  }

  const fromScript: Script = cellCollector.fromScript;

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
  for (; i < txSkeleton.get("outputs").size && capacity > 0; i++) {
    const output = txSkeleton.get("outputs").get(i)!;
    if (
      new ScriptValue(output.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const cellCapacity: bigint = BigInt(output.cell_output.capacity);
      const availableCapacity: bigint =
        cellCapacity - minimalCellCapacity(output);
      // should maintain minimal cell capcity in anyone-can-pay output
      const deductCapacity: bigint =
        capacity >= availableCapacity ? availableCapacity : capacity;
      capacity -= deductCapacity;
      output.cell_output.capacity =
        "0x" + (cellCapacity - deductCapacity).toString(16);
    }
  }
  // Remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) => BigInt(output.cell_output.capacity) !== BigInt(0)
    );
  });

  const getInputKey = (input: Cell) =>
    `${input.out_point!.tx_hash}_${input.out_point!.index}`;
  if (capacity > 0n) {
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
    let changeCapacity = 0n;
    const minimalChangeCapacity: bigint = minimalCellCapacity(changeCell);
    const firstInjectInputIndex = txSkeleton.get("inputs").size;

    let previousInputs = Set<string>();
    for (const input of txSkeleton.get("inputs")) {
      previousInputs = previousInputs.add(getInputKey(input));
    }

    // Are all from same lock script and type script, so only need one change cell
    for await (const inputCell of cellCollector.collect()) {
      if (previousInputs.has(getInputKey(inputCell))) {
        continue;
      }

      txSkeleton = txSkeleton.update("inputs", (inputs) => {
        return inputs.push(inputCell);
      });
      txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
        return witnesses.push("0x");
      });

      const inputCapacity = BigInt(inputCell.cell_output.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > capacity) {
        deductCapacity = capacity;
      }
      capacity -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;
      if (capacity === 0n && changeCapacity >= minimalChangeCapacity) {
        break;
      }

      changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.push(changeCell);
      });
    }

    if (capacity > 0n || changeCapacity < minimalChangeCapacity) {
      throw new Error(`Not enough capacity in from address!`);
    }

    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push(changeCell);
    });

    txSkeleton = await setupInputCell(txSkeleton, firstInjectInputIndex, {
      config,
    });
  }

  return txSkeleton;
}

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromAddress: Address,
  toAddress: Address,
  capacity: bigint,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error(`Cell Provider is missing!`);
  }

  const toScript = parseAddress(toAddress, { config });

  if (!isAcpAddress(fromAddress, config)) {
    throw new Error("`fromAddress` is not ANYONE_CAN_PAY address!");
  }
  if (!isAcpScript(toScript, config)) {
    throw new Error("`toAddress` is not ANYONE_CAN_PAY address!");
  }

  const cellCollector = new CellCollector(fromAddress, cellProvider, {
    config,
  });

  const toAddressCellCollector = new CellCollector(toAddress, cellProvider, {
    config,
  });

  const toAddressInput: Cell | void = (
    await toAddressCellCollector.collect().next()
  ).value;
  if (!toAddressInput) {
    throw new Error(`toAddress ANYONE_CAN_PAY input not found!`);
  }

  const outputCapacity: bigint =
    BigInt(capacity) + BigInt(toAddressInput.cell_output.capacity);
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: "0x" + outputCapacity.toString(16),
        lock: toScript,
        type: undefined,
      },
      data: "0x",
      out_point: undefined,
      block_hash: undefined,
    });
  });
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(toAddressInput);
  });
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push("0x");
  });

  txSkeleton = await injectCapacity(
    cellCollector,
    txSkeleton,
    txSkeleton.get("outputs").size - 1,
    capacity,
    { config }
  );

  return txSkeleton;
}

export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();

  const scriptType = "ANYONE_CAN_PAY";
  const template = config.SCRIPTS[scriptType];
  if (!template) {
    throw new Error(
      `Provided config does not have ${scriptType} script setup!`
    );
  }

  let processedArgs = Set<string>();
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = ckbHash(
    core.SerializeRawTransaction(normalizers.NormalizeRawTransaction(tx))
  ).serializeJson();
  const inputs = txSkeleton.get("inputs");
  const witnesses = txSkeleton.get("witnesses");
  let signingEntries = txSkeleton.get("signingEntries");
  for (let i = 0; i < inputs.size; i++) {
    const input = inputs.get(i)!;
    if (
      template.CODE_HASH === input.cell_output.lock.code_hash &&
      template.HASH_TYPE === input.cell_output.lock.hash_type &&
      !processedArgs.has(input.cell_output.lock.args)
    ) {
      processedArgs = processedArgs.add(input.cell_output.lock.args);

      // skip if input sum capcity <= output sum capacity
      // and input sum amount <= output sum amount
      const outputs: List<Cell> = txSkeleton.get("outputs").filter((output) => {
        return new ScriptValue(output.cell_output.lock, {
          validate: false,
        }).equals(new ScriptValue(input.cell_output.lock, { validate: false }));
      });
      const sumOfOutputCapacity: bigint = outputs
        .map((output) => BigInt(output.cell_output.capacity))
        .reduce((result, c) => result + c, 0n);

      const sumOfOutputAmount: bigint = outputs
        .filter((output) => output.data !== "0x")
        .map((output) => readBigUInt128LE(output.data))
        .reduce((result, c) => result + c, 0n);

      const fInputs: List<Cell> = inputs.filter((i) => {
        return new ScriptValue(i.cell_output.lock, { validate: false }).equals(
          new ScriptValue(input.cell_output.lock, { validate: false })
        );
      });

      const sumOfInputCapacity: bigint = fInputs
        .map((i) => BigInt(i.cell_output.capacity))
        .reduce((result, c) => result + c, 0n);

      const sumOfInputAmount: bigint = fInputs
        .filter((i) => i.data !== "0x")
        .map((i) => readBigUInt128LE(i.data))
        .reduce((result, c) => result + c, 0n);

      if (
        sumOfInputCapacity <= sumOfOutputCapacity &&
        sumOfInputAmount <= sumOfOutputAmount
      ) {
        continue;
      }

      const lockValue = new values.ScriptValue(input.cell_output.lock, {
        validate: false,
      });
      const hasher = new CKBHasher();
      hasher.update(txHash);
      if (i >= witnesses.size) {
        throw new Error(
          `The first witness in the script group starting at input index ${i} does not exist, maybe some other part has invalidly tampered the transaction?`
        );
      }
      hashWitness(hasher, witnesses.get(i)!);
      for (let j = i + 1; j < inputs.size && j < witnesses.size; j++) {
        const otherInput = inputs.get(j)!;
        if (
          lockValue.equals(
            new values.ScriptValue(otherInput.cell_output.lock, {
              validate: false,
            })
          )
        ) {
          hashWitness(hasher, witnesses.get(j)!);
        }
      }
      for (let j = inputs.size; j < witnesses.size; j++) {
        hashWitness(hasher, witnesses.get(j)!);
      }
      const signingEntry = {
        type: "witness_args_lock",
        index: i,
        message: hasher.digestHex(),
      };
      signingEntries = signingEntries.push(signingEntry);
    }
  }
  txSkeleton = txSkeleton.set("signingEntries", signingEntries);
  return txSkeleton;
}

export async function destroyAnyoneCanPayInput(
  txSkeleton: TransactionSkeletonType,
  input: Cell,
  toAddress: Address,
  fee: bigint = 0n,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  if (!isAcpScript(input.cell_output.lock, config)) {
    throw new Error(`input is not an ANYONE_CAN_PAY input!`);
  }

  if (!toAddress) {
    throw new Error(`You must provide toAddress!`);
  }
  const toScript: Script = parseAddress(toAddress, { config });

  const targetCapacity: bigint =
    BigInt(input.cell_output.capacity) - BigInt(fee);
  const targetOutput: Cell = {
    cell_output: {
      capacity: "0x" + targetCapacity.toString(16),
      lock: toScript,
      type: input.cell_output.type,
    },
    data: input.data,
  };

  if (targetCapacity < minimalCellCapacity(targetOutput)) {
    throw new Error("Input capacity not enough!");
  }

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(input);
  });

  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push("0x");
  });

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(targetOutput);
  });

  txSkeleton = await setupInputCell(
    txSkeleton,
    txSkeleton.get("inputs").size - 1,
    { config }
  );

  return txSkeleton;
}

export default {
  CellCollector,
  setupInputCell,
  injectCapacity,
  transfer,
  prepareSigningEntries,
  destroyAnyoneCanPayInput,
};
