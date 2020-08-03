import {
  parseAddress,
  TransactionSkeletonType,
  Options,
  minimalCellCapacity,
} from "@ckb-lumos/helpers";
import secp256k1Blake160Multisig from "./secp256k1_blake160_multisig";
import { FromInfo, parseFromInfo } from "./from_info";
import secp256k1Blake160 from "./secp256k1_blake160";
import {
  prepareSigningEntries as _prepareSigningEntries,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
  isAcpScript,
} from "./helper";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import locktimePool from "./locktime_pool";
import {
  Address,
  Header,
  Script,
  values,
  Cell,
  HexString,
} from "@ckb-lumos/base";
import anyoneCanPay from "./anyone_can_pay";
const { ScriptValue } = values;
import { Set } from "immutable";

/**
 *
 * @param txSkeleton
 * @param fromInfos
 * @param toAddress
 * @param changeAddress
 * @param amount
 * @param tipHeader will not use locktime cells if tipHeader not provided
 * @param options
 */
export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address,
  amount: bigint,
  changeAddress?: Address,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
    LocktimePoolCellCollector = locktimePool.CellCollector,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    LocktimePoolCellCollector?: any;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  if (!toAddress) {
    throw new Error("You must provide a to address!");
  }

  const toScript: Script = parseAddress(toAddress, { config });
  const targetOutput: Cell = {
    cell_output: {
      capacity: "0x" + BigInt(amount).toString(16),
      lock: toScript,
      type: undefined,
    },
    data: "0x",
  };
  if (isAcpScript(toScript, config)) {
    if (toScript.args.length >= 46) {
      const minimalAmount: bigint =
        10n ** BigInt("0x" + toScript.args.slice(44, 46));
      throw new Error(
        `Requires to transfer ${minimalAmount} to \`toAddress\` at least! please use sudt.transfer.`
      );
    }
    if (toScript.args.length >= 44) {
      const minimalCapcity: bigint =
        10n ** BigInt("0x" + toScript.args.slice(42, 44));
      if (amount < minimalCapcity) {
        throw new Error(`capacity less than toAddress minimal capacity`);
      }
    }

    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error(`Cell Provider is missing!`);
    }

    const toAddressCellCollector = new anyoneCanPay.CellCollector(
      toAddress,
      cellProvider,
      {
        config,
      }
    );

    const toAddressInput: Cell | void = (
      await toAddressCellCollector.collect().next()
    ).value;
    if (!toAddressInput) {
      throw new Error(`toAddress ANYONE_CAN_PAY input not found!`);
    }

    const outputCapacity: bigint =
      BigInt(amount) + BigInt(toAddressInput.cell_output.capacity);
    targetOutput.cell_output.capacity = "0x" + outputCapacity.toString(16);

    txSkeleton = txSkeleton.update("inputs", (inputs) => {
      return inputs.push(toAddressInput);
    });
    txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
      return witnesses.push("0x");
    });
  }

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(targetOutput);
  });

  txSkeleton = await injectCapacity(
    txSkeleton,
    fromInfos,
    amount,
    changeAddress,
    tipHeader,
    {
      config,
      useLocktimeCellsFirst,
      LocktimePoolCellCollector,
    }
  );

  return txSkeleton;
}

export async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  changeAddress?: Address,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
    LocktimePoolCellCollector = locktimePool.CellCollector,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    LocktimePoolCellCollector?: any;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  amount = BigInt(amount);
  let deductAmount = BigInt(amount);

  if (fromInfos.length === 0) {
    throw new Error("No from info provided!");
  }

  const changeLockScript: Script = parseFromInfo(
    changeAddress || fromInfos[0]!,
    { config }
  ).fromScript;
  const changeCell: Cell = {
    cell_output: {
      capacity: "0x0",
      lock: changeLockScript,
      type: undefined,
    },
    data: "0x",
  };
  const minimalChangeCapacity: bigint = minimalCellCapacity(changeCell);

  let changeCapacity: bigint = 0n;
  if (useLocktimeCellsFirst) {
    if (tipHeader) {
      const result = await locktimePool.injectCapacityWithoutChange(
        txSkeleton,
        fromInfos,
        deductAmount,
        tipHeader,
        minimalChangeCapacity,
        {
          config,
          LocktimeCellCollector: LocktimePoolCellCollector,
        }
      );
      txSkeleton = result.txSkeleton;
      deductAmount = result.capacity;
      // if deductAmount > 0, changeCapacity must be 0
      changeCapacity = result.changeCapacity;
    }

    if (deductAmount > 0n) {
      const result = await _commonTransfer(
        txSkeleton,
        fromInfos,
        deductAmount,
        minimalChangeCapacity,
        { config }
      );
      txSkeleton = result.txSkeleton;
      deductAmount = result.capacity;
      changeCapacity = result.changeCapacity;
    } else if (
      deductAmount === 0n &&
      changeCapacity > 0n &&
      changeCapacity < minimalChangeCapacity
    ) {
      const result = await _commonTransfer(
        txSkeleton,
        fromInfos,
        minimalChangeCapacity - changeCapacity,
        0n,
        { config }
      );
      txSkeleton = result.txSkeleton;
      deductAmount = result.capacity;
      changeCapacity = result.changeCapacity;
    }
  } else {
    const result = await _commonTransfer(
      txSkeleton,
      fromInfos,
      deductAmount,
      minimalChangeCapacity,
      { config }
    );
    txSkeleton = result.txSkeleton;
    deductAmount = result.capacity;
    changeCapacity = result.changeCapacity;

    if (tipHeader) {
      if (deductAmount > 0n) {
        const result = await locktimePool.injectCapacityWithoutChange(
          txSkeleton,
          fromInfos,
          deductAmount,
          tipHeader,
          minimalChangeCapacity,
          {
            config,
            LocktimeCellCollector: LocktimePoolCellCollector,
          }
        );
        txSkeleton = result.txSkeleton;
        deductAmount = result.capacity;
        changeCapacity = result.changeCapacity;
      } else if (
        deductAmount === 0n &&
        changeCapacity > 0n &&
        changeCapacity < minimalChangeCapacity
      ) {
        const result = await locktimePool.injectCapacityWithoutChange(
          txSkeleton,
          fromInfos,
          minimalChangeCapacity - changeCapacity,
          tipHeader,
          0n,
          {
            config,
            LocktimeCellCollector: LocktimePoolCellCollector,
          }
        );
        txSkeleton = result.txSkeleton;
        deductAmount = result.capacity;
        changeCapacity = result.changeCapacity;
      }
    }
  }

  if (deductAmount > 0n) {
    throw new Error("Not enough capacity in from infos!");
  }

  if (changeCapacity > 0n && changeCapacity < minimalChangeCapacity) {
    throw new Error("Not enough capacity in from infos for change!");
  }

  if (changeCapacity > 0n) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push(changeCell);
    });
  }

  return txSkeleton;
}

export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  return injectCapacity(txSkeleton, fromInfos, amount, undefined, tipHeader, {
    config,
    useLocktimeCellsFirst,
  });
}

export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();
  txSkeleton = _prepareSigningEntries(txSkeleton, config, "SECP256K1_BLAKE160");
  txSkeleton = _prepareSigningEntries(
    txSkeleton,
    config,
    "SECP256K1_BLAKE160_MULTISIG"
  );
  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, { config });
  return txSkeleton;
}

async function _commonTransfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  minimalChangeCapacity: bigint,
  { config = undefined }: Options = {}
): Promise<{
  txSkeleton: TransactionSkeletonType;
  capacity: bigint;
  changeCapacity: bigint;
}> {
  config = config || getConfig();
  amount = BigInt(amount);

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell Provider is missing!");
  }

  const getInputKey = (input: Cell) =>
    `${input.out_point!.tx_hash}_${input.out_point!.index}`;
  let previousInputs = Set<string>();
  for (const input of txSkeleton.get("inputs")) {
    previousInputs = previousInputs.add(getInputKey(input));
  }

  const fromScripts: Script[] = fromInfos.map((fromInfo) => {
    return parseFromInfo(fromInfo, { config }).fromScript;
  });

  for (const fromScript of fromScripts) {
    if (amount > 0n) {
      [txSkeleton, amount] = _deductCapacity(txSkeleton, fromScript, amount);
    }
  }

  let changeCapacity: bigint = 0n;

  // collect cells
  loop1: for (const fromInfo of fromInfos) {
    const cellCollectors = [
      new secp256k1Blake160.CellCollector(fromInfo, cellProvider, {
        config,
      }),
      new secp256k1Blake160Multisig.CellCollector(fromInfo, cellProvider, {
        config,
      }),
      new anyoneCanPay.CellCollector(fromInfo, cellProvider, {
        config,
      }),
    ];

    for (const cellCollector of cellCollectors) {
      for await (const inputCell of cellCollector.collect()) {
        const inputKey: string = getInputKey(inputCell);
        if (previousInputs.has(inputKey)) {
          continue;
        }

        previousInputs = previousInputs.add(inputKey);
        const result = setupInputCell(txSkeleton, inputCell, fromInfo, {
          config,
          needCapacity: "0x" + amount.toString(16),
        });
        txSkeleton = result.txSkeleton;

        const inputCapacity: bigint = BigInt(result.usedCapacity);
        let deductCapacity: bigint = inputCapacity;
        if (deductCapacity > amount) {
          deductCapacity = amount;
        }
        amount -= deductCapacity;
        changeCapacity += inputCapacity - deductCapacity;

        if (
          amount === 0n &&
          (changeCapacity === 0n || changeCapacity > minimalChangeCapacity)
        ) {
          break loop1;
        }
      }
    }
  }

  return {
    txSkeleton,
    capacity: amount,
    changeCapacity,
  };
}

function _deductCapacity(
  txSkeleton: TransactionSkeletonType,
  fromScript: Script,
  capacity: bigint
): [TransactionSkeletonType, bigint] {
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
      const cellCapacity = BigInt(output.cell_output.capacity);
      const availableCapacity: bigint = cellCapacity;
      let deductCapacity;
      if (capacity >= availableCapacity) {
        deductCapacity = availableCapacity;
      } else {
        deductCapacity = cellCapacity - minimalCellCapacity(output);
        if (deductCapacity > capacity) {
          deductCapacity = capacity;
        }
      }
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

  return [txSkeleton, capacity];
}

export function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  fromInfo: FromInfo,
  {
    config = undefined,
    needCapacity = undefined,
  }: Options & { needCapacity?: HexString } = {}
): {
  txSkeleton: TransactionSkeletonType;
  usedCapacity: HexString;
} {
  config = config || getConfig();

  const inputLock = inputCell.cell_output.lock;

  if (isSecp256k1Blake160Script(inputLock, config)) {
    return secp256k1Blake160.setupInputCell(txSkeleton, inputCell, fromInfo, {
      config,
    });
  } else if (isSecp256k1Blake160MultisigScript(inputLock, config)) {
    return secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      inputCell,
      fromInfo,
      { config }
    );
  } else if (isAcpScript(inputLock, config)) {
    return anyoneCanPay.setupInputCell(txSkeleton, inputCell, fromInfo, {
      config,
      needCapacity,
    });
  } else {
    throw new Error(`Not supported input lock!`);
  }
}

export default {
  transfer,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
  __tests__: {
    _commonTransfer,
  },
};
