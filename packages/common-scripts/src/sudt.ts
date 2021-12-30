import { addCellDep, isAcpScript } from "./helper";
import {
  utils,
  Hash,
  Address,
  Cell,
  Script,
  Header,
  CellCollector as CellCollectorInterface,
  values,
  JSBI,
} from "@ckb-lumos/base";
const { toBigUInt128LE, computeScriptHash } = utils;
import secp256k1Blake160Multisig from "./secp256k1_blake160_multisig";
import { FromInfo, parseFromInfo } from "./from_info";
import common from "./common";
import {
  parseAddress,
  TransactionSkeletonType,
  Options,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import { Set, List } from "immutable";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import { CellCollector as LocktimeCellCollector } from "./locktime_pool";
import anyoneCanPay, {
  CellCollector as AnyoneCanPayCellCollector,
} from "./anyone_can_pay";
const { ScriptValue } = values;
import secp256k1Blake160 from "./secp256k1_blake160";
import { readBigUInt128LECompatible } from "@ckb-lumos/base/lib/utils";

export type Token = Hash;

/**
 * Issue an sUDT cell
 *
 * @param txSkeleton
 * @param fromInfo
 * @param amount
 * @param capacity
 * @param tipHeader
 * @param options
 */
export async function issueToken(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  amount: bigint | JSBI,
  capacity?: bigint | JSBI,
  tipHeader?: Header,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  amount = JSBI.BigInt(amount.toString());
  capacity = capacity ? JSBI.BigInt(capacity.toString()) : capacity;
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

  const fromScript = parseFromInfo(fromInfo, { config }).fromScript;

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
    capacity = minimalCellCapacityCompatible(targetOutput);
  }
  capacity = JSBI.BigInt(capacity.toString());
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
    [fromInfo],
    JSBI.BigInt(targetOutput.cell_output.capacity),
    undefined,
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
 * @param options When `splitChangeCell = true` && change amount > 0 && change capacity >= minimalCellCapacity(change cell with sudt) + minimalCellCapacity(change cell without sudt), change cell will split to two change cells, one with sudt and one without.
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  sudtToken: Token,
  toAddress: Address,
  amount: bigint | JSBI,
  changeAddress?: Address,
  capacity?: bigint | JSBI,
  tipHeader?: Header,
  {
    config = undefined,
    LocktimePoolCellCollector = LocktimeCellCollector,
    splitChangeCell = false,
  }: Options & {
    LocktimePoolCellCollector?: any;
    splitChangeCell?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  amount = JSBI.BigInt(amount.toString());
  capacity = capacity ? JSBI.BigInt(capacity.toString()) : undefined;

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

  const fromScripts: Script[] = fromInfos.map(
    (fromInfo) => parseFromInfo(fromInfo, { config }).fromScript
  );
  const changeOutputLockScript = changeAddress
    ? parseAddress(changeAddress, { config })
    : fromScripts[0];

  amount = JSBI.BigInt(amount);
  if (JSBI.lessThanOrEqual(amount, JSBI.BigInt(0))) {
    throw new Error("amount must be greater than 0");
  }

  const sudtType = _generateSudtScript(sudtToken, config);

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }

  // if toScript is an anyone-can-pay script
  let toAddressInputCapacity: JSBI = JSBI.BigInt(0);
  let toAddressInputAmount: JSBI = JSBI.BigInt(0);
  if (isAcpScript(toScript, config)) {
    const toAddressCellCollector = new AnyoneCanPayCellCollector(
      toAddress,
      cellProvider,
      {
        config,
        queryOptions: {
          type: sudtType,
          data: "any",
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

    toAddressInputCapacity = JSBI.BigInt(toAddressInput.cell_output.capacity);
    toAddressInputAmount = readBigUInt128LECompatible(toAddressInput.data);
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
    capacity = JSBI.BigInt(capacity);
  }
  if (isAcpScript(toScript, config)) {
    if (!capacity) {
      capacity = JSBI.BigInt(0);
    }
    targetOutput.cell_output.capacity =
      "0x" + JSBI.add(toAddressInputCapacity, capacity).toString(16);
    targetOutput.data = toBigUInt128LE(
      JSBI.add(toAddressInputAmount, JSBI.BigInt(amount))
    );
  } else {
    if (!capacity) {
      capacity = minimalCellCapacityCompatible(targetOutput);
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
  let changeCapacity = JSBI.BigInt(0);
  let changeAmount = JSBI.BigInt(0);
  let previousInputs = Set<string>();
  for (const input of txSkeleton.get("inputs")) {
    previousInputs = previousInputs.add(
      `${input.out_point!.tx_hash}_${input.out_point!.index}`
    );
  }
  let cellCollectorInfos: List<{
    cellCollector: CellCollectorInterface;
    index: number;
    isAnyoneCanPay?: boolean;
    destroyable?: boolean;
  }> = List();
  if (tipHeader) {
    fromInfos.forEach((fromInfo, index) => {
      const locktimePoolCellCollector = new LocktimePoolCellCollector(
        fromInfo,
        cellProvider,
        {
          config,
          tipHeader,
          queryOptions: {
            type: sudtType,
            data: "any",
          },
        }
      );

      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: locktimePoolCellCollector,
        index,
      });
    });
  }
  fromInfos.forEach((fromInfo, index) => {
    const secpCollector = new secp256k1Blake160.CellCollector(
      fromInfo,
      cellProvider,
      {
        config,
        queryOptions: {
          type: sudtType,
          data: "any",
        },
      }
    );
    const multisigCollector = new secp256k1Blake160Multisig.CellCollector(
      fromInfo,
      cellProvider,
      {
        config,
        queryOptions: {
          type: sudtType,
          data: "any",
        },
      }
    );
    const acpCollector = new anyoneCanPay.CellCollector(
      fromInfo,
      cellProvider,
      {
        config,
        queryOptions: {
          type: sudtType,
          data: "any",
        },
      }
    );

    cellCollectorInfos = cellCollectorInfos.push(
      {
        cellCollector: secpCollector,
        index,
      },
      {
        cellCollector: multisigCollector,
        index,
      },
      {
        cellCollector: acpCollector,
        index,
        isAnyoneCanPay: true,
        destroyable: parseFromInfo(fromInfo, { config }).destroyable,
      }
    );
  });
  if (tipHeader) {
    fromInfos.forEach((fromInfo, index) => {
      const locktimeCellCollector = new LocktimePoolCellCollector(
        fromInfo,
        cellProvider,
        {
          config,
          tipHeader,
        }
      );

      cellCollectorInfos = cellCollectorInfos.push({
        cellCollector: locktimeCellCollector,
        index,
      });
    });
  }
  fromInfos.forEach((fromInfo, index) => {
    const secpCollector = new secp256k1Blake160.CellCollector(
      fromInfo,
      cellProvider,
      {
        config,
      }
    );
    const multisigCollector = new secp256k1Blake160Multisig.CellCollector(
      fromInfo,
      cellProvider,
      {
        config,
      }
    );
    const acpCollector = new anyoneCanPay.CellCollector(
      fromInfo,
      cellProvider,
      {
        config,
      }
    );

    cellCollectorInfos = cellCollectorInfos.push(
      {
        cellCollector: secpCollector,
        index,
      },
      {
        cellCollector: multisigCollector,
        index,
      },
      {
        cellCollector: acpCollector,
        index,
        isAnyoneCanPay: true,
        destroyable: parseFromInfo(fromInfo, { config }).destroyable,
      }
    );
  });
  for (const {
    index,
    cellCollector,
    isAnyoneCanPay,
    destroyable,
  } of cellCollectorInfos) {
    for await (const inputCell of cellCollector.collect()) {
      // skip inputs already exists in txSkeleton.inputs
      const key = `${inputCell.out_point!.tx_hash}_${
        inputCell.out_point!.index
      }`;
      if (previousInputs.has(key)) {
        continue;
      }
      previousInputs = previousInputs.add(key);

      const fromInfo = fromInfos[index];
      txSkeleton = await common.setupInputCell(
        txSkeleton,
        inputCell,
        fromInfo,
        {
          config,
        }
      );
      // remove output which added by `setupInputCell`
      const lastOutputIndex: number = txSkeleton.get("outputs").size - 1;
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.remove(lastOutputIndex);
      });
      // remove output fixedEntry
      const fixedEntryIndex: number = txSkeleton
        .get("fixedEntries")
        .findIndex((fixedEntry) => {
          return (
            fixedEntry.field === "outputs" &&
            fixedEntry.index === lastOutputIndex
          );
        });
      if (fixedEntryIndex >= 0) {
        txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
          return fixedEntries.remove(fixedEntryIndex);
        });
      }

      const inputCapacity: JSBI = JSBI.BigInt(inputCell.cell_output.capacity);
      const inputAmount: JSBI = inputCell.cell_output.type
        ? readBigUInt128LECompatible(inputCell.data)
        : JSBI.BigInt(0);
      let deductCapacity: JSBI =
        isAnyoneCanPay && !destroyable
          ? JSBI.subtract(
              inputCapacity,
              minimalCellCapacityCompatible(inputCell)
            )
          : inputCapacity;
      let deductAmount: JSBI = inputAmount;
      if (JSBI.greaterThan(deductCapacity, JSBI.BigInt(capacity.toString()))) {
        deductCapacity = JSBI.BigInt(capacity.toString());
      }
      capacity = JSBI.subtract(
        JSBI.BigInt(capacity.toString()),
        deductCapacity
      );
      const currentChangeCapacity: JSBI = JSBI.subtract(
        inputCapacity,
        deductCapacity
      );
      if (!isAnyoneCanPay || (isAnyoneCanPay && destroyable)) {
        changeCapacity = JSBI.add(changeCapacity, currentChangeCapacity);
      }
      if (JSBI.greaterThan(deductAmount, amount)) {
        deductAmount = amount;
      }
      amount = JSBI.subtract(amount, deductAmount);
      const currentChangeAmount: JSBI = JSBI.subtract(
        inputAmount,
        deductAmount
      );
      if (!isAnyoneCanPay || (isAnyoneCanPay && destroyable)) {
        changeAmount = JSBI.add(changeAmount, currentChangeAmount);
      }

      if (isAnyoneCanPay && !destroyable) {
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
        JSBI.equal(capacity, JSBI.BigInt(0)) &&
        JSBI.equal(amount, JSBI.BigInt(0)) &&
        ((JSBI.equal(changeCapacity, JSBI.BigInt(0)) &&
          JSBI.equal(changeAmount, JSBI.BigInt(0))) ||
          (JSBI.greaterThan(
            changeCapacity,
            minimalCellCapacityCompatible(changeCellWithoutSudt)
          ) &&
            JSBI.equal(changeAmount, JSBI.BigInt(0))))
      ) {
        changeCell.cell_output.type = undefined;
        changeCell.data = "0x";
        break;
      }
      if (
        JSBI.equal(capacity, JSBI.BigInt(0)) &&
        JSBI.equal(amount, JSBI.BigInt(0)) &&
        JSBI.greaterThan(
          changeCapacity,
          minimalCellCapacityCompatible(changeCellWithoutSudt)
        ) &&
        JSBI.greaterThan(changeAmount, JSBI.BigInt(0))
      ) {
        break;
      }
    }
  }

  // if change cell is an anyone-can-pay cell and exists in txSkeleton.get("outputs") and not in fixedEntries
  // 1. change lock script is acp
  // 2. lock and type are equal to output OutputA in outputs
  // 3. OutputA is not fixed.
  let changeOutputIndex = -1;
  if (
    isAcpScript(changeCell.cell_output.lock, config) &&
    (changeOutputIndex = txSkeleton.get("outputs").findIndex((output) => {
      return (
        new ScriptValue(changeCell.cell_output.lock, {
          validate: false,
        }).equals(
          new ScriptValue(output.cell_output.lock, { validate: false })
        ) &&
        ((JSBI.equal(changeAmount, JSBI.BigInt(0)) &&
          !changeCell.cell_output.type &&
          !output.cell_output.type) ||
          (JSBI.greaterThanOrEqual(changeAmount, JSBI.BigInt(0)) &&
            !!changeCell.cell_output.type &&
            !!output.cell_output.type &&
            new ScriptValue(changeCell.cell_output.type, {
              validate: false,
            }).equals(
              new ScriptValue(output.cell_output.type, { validate: false })
            )))
      );
    })) !== -1 &&
    txSkeleton.get("fixedEntries").findIndex((fixedEntry) => {
      return (
        fixedEntry.field === "output" && fixedEntry.index === changeOutputIndex
      );
    }) === -1
  ) {
    const originOutput: Cell = txSkeleton
      .get("outputs")
      .get(changeOutputIndex)!;
    const clonedOutput: Cell = JSON.parse(JSON.stringify(originOutput));
    clonedOutput.cell_output.capacity =
      "0x" +
      JSBI.add(
        JSBI.BigInt(originOutput.cell_output.capacity),
        changeCapacity
      ).toString(16);
    if (JSBI.greaterThan(changeAmount, JSBI.BigInt(0))) {
      clonedOutput.data = toBigUInt128LE(
        JSBI.add(readBigUInt128LECompatible(originOutput.data), changeAmount)
      );
    }

    const minimalChangeCellCapcaity = minimalCellCapacityCompatible(changeCell);
    const minimalChangeCellWithoutSudtCapacity = minimalCellCapacityCompatible(
      changeCellWithoutSudt
    );
    let splitFlag: boolean = false;
    if (
      JSBI.greaterThan(changeAmount, JSBI.BigInt(0)) &&
      splitChangeCell &&
      JSBI.greaterThanOrEqual(
        changeCapacity,
        JSBI.add(
          minimalChangeCellCapcaity,
          minimalChangeCellWithoutSudtCapacity
        )
      )
    ) {
      clonedOutput.cell_output.capacity = originOutput.cell_output.capacity;
      changeCellWithoutSudt.cell_output.capacity =
        "0x" + changeCapacity.toString(16);
      splitFlag = true;
    }

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.set(changeOutputIndex, clonedOutput);
    });

    if (splitFlag) {
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.push(changeCellWithoutSudt);
      });
    }
  } else if (
    JSBI.greaterThanOrEqual(
      changeCapacity,
      minimalCellCapacityCompatible(changeCell)
    )
  ) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    if (JSBI.greaterThan(changeAmount, JSBI.BigInt(0))) {
      changeCell.data = toBigUInt128LE(changeAmount);
    }

    const minimalChangeCellCapcaity = minimalCellCapacityCompatible(changeCell);
    const minimalChangeCellWithoutSudtCapacity = minimalCellCapacityCompatible(
      changeCellWithoutSudt
    );
    let splitFlag = false;
    if (JSBI.greaterThan(changeAmount, JSBI.BigInt(0)) && splitChangeCell) {
      if (
        JSBI.greaterThanOrEqual(
          changeCapacity,
          JSBI.add(
            minimalChangeCellCapcaity,
            minimalChangeCellWithoutSudtCapacity
          )
        )
      ) {
        changeCell.cell_output.capacity =
          "0x" + minimalChangeCellCapcaity.toString(16);
        changeCellWithoutSudt.cell_output.capacity =
          "0x" +
          JSBI.subtract(changeCapacity, minimalChangeCellCapcaity).toString(16);
        splitFlag = true;
      }
    }

    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
    if (JSBI.greaterThan(changeAmount, JSBI.BigInt(0))) {
      txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
        return fixedEntries.push({
          field: "outputs",
          index: txSkeleton.get("outputs").size - 1,
        });
      });
    }
    if (splitFlag) {
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.push(changeCellWithoutSudt);
      });
    }
  } else if (
    JSBI.greaterThan(changeAmount, JSBI.BigInt(0)) &&
    JSBI.lessThan(changeCapacity, minimalCellCapacityCompatible(changeCell))
  ) {
    throw new Error("Not enough capacity for change in from infos!");
  }
  if (JSBI.greaterThan(JSBI.BigInt(capacity.toString()), JSBI.BigInt(0))) {
    throw new Error("Not enough capacity in from infos!");
  }
  if (JSBI.greaterThan(amount, JSBI.BigInt(0))) {
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
