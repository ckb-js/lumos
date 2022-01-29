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
import { BI, BIish } from "@ckb-lumos/bi";

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
  amount: BIish,
  capacity?: BIish,
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
  let _capacity = BI.from(capacity);
  targetOutput.cell_output.capacity = "0x" + _capacity.toString(16);

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
    BI.from(BI.from(targetOutput.cell_output.capacity)),
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
  amount: BIish,
  changeAddress?: Address,
  capacity?: BIish,
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
  let _amount = BI.from(amount);
  let _capacity = capacity ? BI.from(capacity) : undefined;

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

  if (_amount.lte(0)) {
    throw new Error("amount must be greater than 0");
  }

  const sudtType = _generateSudtScript(sudtToken, config);

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }

  // if toScript is an anyone-can-pay script
  let toAddressInputCapacity: BI = BI.from(0);
  let toAddressInputAmount: BI = BI.from(0);
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

    toAddressInputCapacity = BI.from(toAddressInput.cell_output.capacity);
    toAddressInputAmount = BI.from(
      readBigUInt128LECompatible(toAddressInput.data)
    );
  }

  const targetOutput: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: toScript,
      type: sudtType,
    },
    data: toBigUInt128LE(_amount.toString()),
    out_point: undefined,
    block_hash: undefined,
  };
  if (isAcpScript(toScript, config)) {
    if (!_capacity) {
      _capacity = BI.from(0);
    }
    targetOutput.cell_output.capacity =
      "0x" + toAddressInputCapacity.add(_capacity).toString(16);
    targetOutput.data = toBigUInt128LE(toAddressInputAmount.add(_amount));
  } else {
    if (!_capacity) {
      _capacity = BI.from(minimalCellCapacityCompatible(targetOutput));
    }
    targetOutput.cell_output.capacity = "0x" + _capacity.toString(16);
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
    data: toBigUInt128LE(BI.from(0).toString()),
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
  let changeCapacity = BI.from(0);
  let changeAmount = BI.from(0);
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

      const inputCapacity: BI = BI.from(inputCell.cell_output.capacity);
      const inputAmount: BI = inputCell.cell_output.type
        ? BI.from(readBigUInt128LECompatible(inputCell.data))
        : BI.from(0);
      let deductCapacity: BI =
        isAnyoneCanPay && !destroyable
          ? inputCapacity.sub(minimalCellCapacityCompatible(inputCell))
          : inputCapacity;
      let deductAmount: BI = inputAmount;
      if (deductCapacity.gt(_capacity)) {
        deductCapacity = BI.from(_capacity);
      }
      _capacity = _capacity.sub(deductCapacity);
      const currentChangeCapacity: BI = inputCapacity.sub(deductCapacity);
      if (!isAnyoneCanPay || (isAnyoneCanPay && destroyable)) {
        changeCapacity = changeCapacity.add(currentChangeCapacity);
      }
      if (deductAmount.gt(_amount)) {
        deductAmount = _amount;
      }
      _amount = _amount.sub(deductAmount);
      const currentChangeAmount: BI = inputAmount.sub(deductAmount);
      if (!isAnyoneCanPay || (isAnyoneCanPay && destroyable)) {
        changeAmount = changeAmount.add(currentChangeAmount);
      }

      if (isAnyoneCanPay && !destroyable) {
        const acpChangeCell: Cell = {
          cell_output: {
            capacity: "0x" + currentChangeCapacity.toString(16),
            lock: inputCell.cell_output.lock,
            type: inputCell.cell_output.type,
          },
          data: inputCell.cell_output.type
            ? toBigUInt128LE(currentChangeAmount.toString())
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
        _capacity.eq(0) &&
        _amount.eq(0) &&
        ((changeCapacity.eq(0) && changeAmount.eq(0)) ||
          (changeCapacity.gt(
            minimalCellCapacityCompatible(changeCellWithoutSudt)
          ) &&
            changeAmount.eq(0)))
      ) {
        changeCell.cell_output.type = undefined;
        changeCell.data = "0x";
        break;
      }
      if (
        _capacity.eq(0) &&
        _amount.eq(0) &&
        changeCapacity.gt(
          minimalCellCapacityCompatible(changeCellWithoutSudt)
        ) &&
        changeAmount.gt(0)
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
        ((changeAmount.eq(0) &&
          !changeCell.cell_output.type &&
          !output.cell_output.type) ||
          (changeAmount.gte(0) &&
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
      BI.from(originOutput.cell_output.capacity)
        .add(changeCapacity)
        .toString(16);
    if (changeAmount.gt(0)) {
      clonedOutput.data = toBigUInt128LE(
        readBigUInt128LECompatible(originOutput.data).add(changeAmount)
      );
    }

    const minimalChangeCellCapcaity = BI.from(
      minimalCellCapacityCompatible(changeCell)
    );
    const minimalChangeCellWithoutSudtCapacity = BI.from(
      minimalCellCapacityCompatible(changeCellWithoutSudt)
    );
    let splitFlag: boolean = false;
    if (
      changeAmount.gt(0) &&
      splitChangeCell &&
      changeCapacity.gte(
        minimalChangeCellCapcaity.add(minimalChangeCellWithoutSudtCapacity)
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
  } else if (changeCapacity.gte(minimalCellCapacityCompatible(changeCell))) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    if (changeAmount.gt(0)) {
      changeCell.data = toBigUInt128LE(changeAmount.toString());
    }

    const minimalChangeCellCapcaity = BI.from(
      minimalCellCapacityCompatible(changeCell)
    );
    const minimalChangeCellWithoutSudtCapacity = BI.from(
      minimalCellCapacityCompatible(changeCellWithoutSudt)
    );
    let splitFlag = false;
    if (changeAmount.gt(0) && splitChangeCell) {
      if (
        changeCapacity.gte(
          minimalChangeCellCapcaity.add(minimalChangeCellWithoutSudtCapacity)
        )
      ) {
        changeCell.cell_output.capacity =
          "0x" + minimalChangeCellCapcaity.toString(16);
        changeCellWithoutSudt.cell_output.capacity =
          "0x" + changeCapacity.sub(minimalChangeCellCapcaity).toString(16);
        splitFlag = true;
      }
    }

    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
    if (changeAmount.gt(0)) {
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
    changeAmount.gt(0) &&
    changeCapacity.lt(minimalCellCapacityCompatible(changeCell))
  ) {
    throw new Error("Not enough capacity for change in from infos!");
  }
  if (_capacity.gt(0)) {
    throw new Error("Not enough capacity in from infos!");
  }
  if (_amount.gt(0)) {
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
