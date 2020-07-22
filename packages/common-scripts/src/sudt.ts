import { addCellDep, isAcpScript } from "./helper";
import {
  utils,
  Hash,
  Address,
  Cell,
  Script,
  Header,
  CellCollector,
  values,
} from "@ckb-lumos/base";
const { toBigUInt128LE, readBigUInt128LE, computeScriptHash } = utils;
import {
  serializeMultisigScript,
  multisigArgs,
  FromInfo,
  parseFromInfo,
} from "./secp256k1_blake160_multisig";
import common from "./common";
import {
  parseAddress,
  minimalCellCapacity,
  TransactionSkeletonType,
  Options,
  generateAddress,
} from "@ckb-lumos/helpers";
import { Set, List } from "immutable";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import { collectCells, LocktimeCell } from "./locktime_pool";
import { CellCollector as AnyoneCanPayCellCollector } from "./anyone_can_pay";
import anyoneCanPay from "./anyone_can_pay";
const { ScriptValue } = values;

export type Token = Hash;

/**
 * Issue an sUDT cell
 *
 * @param txSkeleton
 * @param fromInfo
 * @param amount
 * @param capacity
 * @param tipHeader
 * @param param5
 */
export async function issueToken(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  amount: bigint,
  capacity?: bigint,
  tipHeader?: Header,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  const template = config.SCRIPTS.SUDT;

  if (!template) {
    throw new Error("Provided config does not have SUDT script setup!");
  }

  txSkeleton = addCellDep(txSkeleton, {
    out_point: {
      tx_hash: template.TX_HASH,
      index: template.INDEX,
    },
    dep_type: template.DEP_TYPE,
  });

  const fromScript = _fromInfoToScript(fromInfo, config);

  const toScript = fromScript;

  const sudtTypeScript = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: computeScriptHash(fromScript),
  };

  const targetOutput: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: toScript,
      type: sudtTypeScript,
    },
    data: toBigUInt128LE(amount),
    out_point: undefined,
    block_hash: undefined,
  };

  if (!capacity) {
    capacity = minimalCellCapacity(targetOutput);
  }
  capacity = BigInt(capacity);
  targetOutput.cell_output.capacity = "0x" + capacity.toString(16);

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(targetOutput);
  });

  const outputIndex = txSkeleton.get("outputs").size - 1;

  // fix entry
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: outputIndex,
    });
  });

  txSkeleton = await common.injectCapacity(
    txSkeleton,
    outputIndex,
    [fromInfo],
    tipHeader,
    {
      config,
    }
  );

  return txSkeleton;
}

/**
 *
 * @param txSkeleton
 * @param fromInfos
 * @param sudtToken
 * @param toAddress
 * @param amount
 * @param changeAddress if not provided, will use first fromInfo
 * @param capacity
 * @param tipHeader
 * @param options
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  sudtToken: Token,
  toAddress: Address,
  amount: bigint,
  changeAddress?: Address,
  capacity?: bigint,
  tipHeader?: Header,
  {
    config = undefined,
    locktimePoolCellCollector = collectCells,
  }: Options & {
    locktimePoolCellCollector?: (
      ...params: any[]
    ) => AsyncIterable<LocktimeCell>;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  const SUDT_SCRIPT = config.SCRIPTS.SUDT;

  if (!SUDT_SCRIPT) {
    throw new Error("Provided config does not have SUDT script setup!");
  }

  if (fromInfos.length === 0) {
    throw new Error("`fromInfos` can't be empty!");
  }

  if (!toAddress) {
    throw new Error("You must provide a to address!");
  }
  const toScript = parseAddress(toAddress, { config });

  const fromScripts: Script[] = fromInfos.map((fromInfo) =>
    _fromInfoToScript(fromInfo, config!)
  );
  const changeOutputLockScript = changeAddress
    ? parseAddress(changeAddress, { config })
    : fromScripts[0];

  amount = BigInt(amount);
  if (amount <= 0n) {
    throw new Error("amount must be greater than 0");
  }

  const sudtType = _generateSudtScript(sudtToken, config);

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }

  // if toScript is an anyone-can-pay script
  let toAddressInputCapacity: bigint = 0n;
  let toAddressInputAmount: bigint = 0n;
  if (isAcpScript(toScript, config)) {
    const toAddressCellCollector = new AnyoneCanPayCellCollector(
      toAddress,
      cellProvider,
      {
        config,
        queryOptions: {
          type: sudtType,
          data: undefined,
        },
      }
    );

    const toAddressInput: Cell | void = (
      await toAddressCellCollector.collect().next()
    ).value;
    if (!toAddressInput) {
      throw new Error(`toAddress ANYONE_CAN_PAY input not found!`);
    }

    txSkeleton = txSkeleton.update("inputs", (inputs) => {
      return inputs.push(toAddressInput);
    });

    txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
      return witnesses.push("0x");
    });

    toAddressInputCapacity = BigInt(toAddressInput.cell_output.capacity);
    toAddressInputAmount = readBigUInt128LE(toAddressInput.data);
  }

  const targetOutput: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: toScript,
      type: sudtType,
    },
    data: toBigUInt128LE(amount),
    out_point: undefined,
    block_hash: undefined,
  };
  if (capacity) {
    capacity = BigInt(capacity);
  }
  if (isAcpScript(toScript, config)) {
    if (!capacity) {
      capacity = 0n;
    }
    targetOutput.cell_output.capacity =
      "0x" + (toAddressInputCapacity + capacity).toString(16);
    targetOutput.data = toBigUInt128LE(toAddressInputAmount + BigInt(amount));
  } else {
    if (!capacity) {
      capacity = minimalCellCapacity(targetOutput);
    }
    targetOutput.cell_output.capacity = "0x" + capacity.toString(16);
  }

  // collect cells with which includes sUDT info
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(targetOutput);
  });

  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: txSkeleton.get("outputs").size - 1,
    });
  });

  txSkeleton = addCellDep(txSkeleton, {
    out_point: {
      tx_hash: SUDT_SCRIPT.TX_HASH,
      index: SUDT_SCRIPT.INDEX,
    },
    dep_type: SUDT_SCRIPT.DEP_TYPE,
  });

  // collect cells
  const changeCell: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: changeOutputLockScript,
      type: sudtType,
    },
    data: toBigUInt128LE(0n),
    out_point: undefined,
    block_hash: undefined,
  };
  const changeCellWithoutSudt: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: changeOutputLockScript,
      type: undefined,
    },
    data: "0x",
    out_point: undefined,
    block_hash: undefined,
  };
  let changeCapacity = BigInt(0);
  let changeAmount = BigInt(0);
  let previousInputs = Set<string>();
  for (const input of txSkeleton.get("inputs")) {
    previousInputs = previousInputs.add(
      `${input.out_point!.tx_hash}_${input.out_point!.index}`
    );
  }
  let cellCollectorInfos: List<{
    cellCollector: CellCollector;
    index: number;
    isAnyoneCanPay?: boolean;
  }> = List();
  if (tipHeader) {
    fromInfos.forEach((fromInfo, index) => {
      const collect = async function* () {
        const result = locktimePoolCellCollector(cellProvider, fromInfo, {
          config,
          tipHeader,
          assertScriptSupported: false,
          queryOptions: {
            type: sudtType,
            data: undefined,
          },
        });
        for await (const r of result) {
          yield r;
        }
      };
      const collector = {
        collect,
      };

      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: collector,
        index,
      });
    });
  }
  fromScripts.forEach((fromScript, index) => {
    if (isAcpScript(fromScript, config!)) {
      const collector = new AnyoneCanPayCellCollector(
        generateAddress(fromScript, { config }),
        cellProvider,
        {
          config,
          queryOptions: {
            type: sudtType,
            data: undefined,
          },
        }
      );
      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: collector,
        index,
        isAnyoneCanPay: true,
      });
    } else {
      const collector = cellProvider.collector({
        lock: fromScript,
        type: sudtType,
        data: undefined,
      });
      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: collector,
        index,
      });
    }
  });
  if (tipHeader) {
    fromInfos.forEach((fromInfo, index) => {
      const collect = async function* () {
        const result = locktimePoolCellCollector(cellProvider, fromInfo, {
          config,
          tipHeader,
          assertScriptSupported: false,
        });
        for await (const r of result) {
          yield r;
        }
      };
      const collector = {
        collect,
      };

      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: collector,
        index,
      });
    });
  }
  fromScripts.forEach((fromScript, index) => {
    if (isAcpScript(fromScript, config!)) {
      const collector = new AnyoneCanPayCellCollector(
        generateAddress(fromScript, { config }),
        cellProvider,
        {
          config,
        }
      );
      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: collector,
        index,
        isAnyoneCanPay: true,
      });
    } else {
      const collector = cellProvider.collector({
        lock: fromScript,
      });

      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: collector,
        index,
      });
    }
  });
  for (const { index, cellCollector, isAnyoneCanPay } of cellCollectorInfos) {
    for await (const inputCell of cellCollector.collect()) {
      // skip inputs already exists in txSkeleton.inputs
      const key = `${inputCell.out_point!.tx_hash}_${
        inputCell.out_point!.index
      }`;
      if (previousInputs.has(key)) {
        continue;
      }
      previousInputs = previousInputs.add(key);
      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(inputCell)
      );
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );

      const fromInfo = fromInfos[index];
      // TODO: update after integrate anyone-can-pay to common
      if (isAnyoneCanPay) {
        txSkeleton = await anyoneCanPay.setupInputCell(
          txSkeleton,
          txSkeleton.get("inputs").size - 1,
          { config }
        );
      } else {
        txSkeleton = await common.setupInputCell(
          txSkeleton,
          txSkeleton.get("inputs").size - 1,
          fromInfo,
          { config }
        );
      }
      const inputCapacity: bigint = BigInt(
        (inputCell as any).maximumCapacity || inputCell.cell_output.capacity
      );
      const inputAmount: bigint = inputCell.cell_output.type
        ? readBigUInt128LE(inputCell.data)
        : 0n;
      let deductCapacity: bigint = isAnyoneCanPay
        ? inputCapacity - minimalCellCapacity(inputCell)
        : inputCapacity;
      let deductAmount: bigint = inputAmount;
      if (deductCapacity > capacity) {
        deductCapacity = capacity;
      }
      capacity -= deductCapacity;
      const currentChangeCapacity: bigint = inputCapacity - deductCapacity;
      if (!isAnyoneCanPay) {
        changeCapacity += currentChangeCapacity;
      }
      if (deductAmount > amount) {
        deductAmount = amount;
      }
      amount -= deductAmount;
      const currentChangeAmount: bigint = inputAmount - deductAmount;
      if (!isAnyoneCanPay) {
        changeAmount += currentChangeAmount;
      }

      if (isAnyoneCanPay) {
        const acpChangeCell: Cell = {
          cell_output: {
            capacity: "0x" + currentChangeCapacity.toString(16),
            lock: inputCell.cell_output.lock,
            type: inputCell.cell_output.type,
          },
          data: inputCell.cell_output.type
            ? toBigUInt128LE(currentChangeAmount)
            : "0x",
        };

        txSkeleton = txSkeleton.update("outputs", (outputs) => {
          return outputs.push(acpChangeCell);
        });

        if (inputCell.cell_output.type) {
          txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
            return fixedEntries.push({
              field: "outputs",
              index: txSkeleton.get("outputs").size - 1,
            });
          });
        }
      }

      // changeAmount = 0n, the change output no need to include sudt type script
      if (
        capacity === 0n &&
        amount === 0n &&
        ((changeCapacity === 0n && changeAmount === 0n) ||
          (changeCapacity > minimalCellCapacity(changeCellWithoutSudt) &&
            changeAmount === 0n))
      ) {
        changeCell.cell_output.type = undefined;
        changeCell.data = "0x";
        break;
      }
      if (
        capacity === 0n &&
        amount === 0n &&
        changeCapacity > minimalCellCapacity(changeCellWithoutSudt) &&
        changeAmount > 0n
      ) {
        break;
      }
    }
  }

  // if change cell is an anyone-can-pay cell and exists in txSkeleton.get("outputs")
  let changeOutputIndex = -1;
  if (
    isAcpScript(changeCell.cell_output.lock, config) &&
    (changeOutputIndex = txSkeleton.get("outputs").findIndex((output) => {
      return new ScriptValue(changeCell.cell_output.lock, {
        validate: false,
      }).equals(new ScriptValue(output.cell_output.lock, { validate: false }));
    })) !== -1
  ) {
    txSkeleton.update("outputs", (outputs) => {
      return outputs.update(changeOutputIndex, (output) => {
        output.cell_output.capacity =
          "0x" +
          (BigInt(output.cell_output.capacity) + changeCapacity).toString(16);
        output.data = toBigUInt128LE(
          readBigUInt128LE(output.data) + changeAmount
        );

        return output;
      });
    });
  } else if (changeCapacity >= minimalCellCapacity(changeCell)) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    if (changeAmount > 0n) {
      changeCell.data = toBigUInt128LE(changeAmount);
    }
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
    if (changeAmount > 0n) {
      txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
        return fixedEntries.push({
          field: "outputs",
          index: txSkeleton.get("outputs").size - 1,
        });
      });
    }
  } else if (
    changeAmount > 0n &&
    changeCapacity < minimalCellCapacity(changeCell)
  ) {
    throw new Error("Not enough capacity for change in from infos!");
  }
  if (capacity > 0) {
    throw new Error("Not enough capacity in from infos!");
  }
  if (amount > 0) {
    throw new Error("Not enough amount in from infos!");
  }

  return txSkeleton;
}

function _generateSudtScript(token: Hash, config: Config): Script {
  const SUDT_SCRIPT = config.SCRIPTS.SUDT!;
  // TODO: check token is a valid hash
  return {
    code_hash: SUDT_SCRIPT.CODE_HASH,
    hash_type: SUDT_SCRIPT.HASH_TYPE,
    args: token,
  };
}

function _fromInfoToScript(fromInfo: FromInfo, config: Config): Script {
  let fromScript;
  if (typeof fromInfo === "string") {
    // fromInfo is an address
    fromScript = parseAddress(fromInfo, { config });
  } else {
    const multisigScript = serializeMultisigScript(fromInfo);
    const fromScriptArgs = multisigArgs(multisigScript, fromInfo.since);
    fromScript = {
      code_hash: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.CODE_HASH,
      hash_type: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.HASH_TYPE,
      args: fromScriptArgs,
    };
  }

  return fromScript;
}

/**
 * Compute sudt token by owner from info.
 *
 * @param fromInfo
 * @param options
 */
export function ownerForSudt(
  fromInfo: FromInfo,
  { config = undefined }: Options = {}
): Token {
  config = config || getConfig();
  const { fromScript } = parseFromInfo(fromInfo, { config });
  const lockHash = computeScriptHash(fromScript);
  return lockHash;
}

export default {
  issueToken,
  transfer,
  ownerForSudt,
};
