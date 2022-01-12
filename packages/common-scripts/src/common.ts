import {
  parseAddress,
  TransactionSkeletonType,
  Options,
  createTransactionFromSkeleton,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import secp256k1Blake160Multisig from "./secp256k1_blake160_multisig";
import { FromInfo, parseFromInfo } from "./from_info";
import secp256k1Blake160 from "./secp256k1_blake160";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import locktimePool from "./locktime_pool";
import {
  Address,
  Header,
  Script,
  values,
  Cell,
  HexString,
  Hash,
  PackedSince,
  utils,
  Transaction,
  JSBI,
} from "@ckb-lumos/base";
import anyoneCanPay from "./anyone_can_pay";
const { ScriptValue } = values;
import { Set } from "immutable";
import { SerializeTransaction } from "@ckb-lumos/base/lib/core";
import { normalizers } from "ckb-js-toolkit";
import { isAcpScript } from "./helper";
import { BI, BIish, toJSBI } from "../../bi/lib";

function defaultLogger(level: string, message: string) {
  console.log(`[${level}] ${message}`);
}

/**
 * CellCollector should be a class which implement CellCollectorInterface.
 * If you want to work well with `transfer`, `injectCapacity`, `payFee`, `payFeeByFeeRate`,
 *  please add the `output` at the end of `txSkeleton.get("outputs")`
 */
export interface LockScriptInfo {
  code_hash: Hash;
  hash_type: "type" | "data";
  lockScriptInfo: {
    CellCollector: any;
    setupInputCell(
      txSkeleton: TransactionSkeletonType,
      inputCell: Cell,
      fromInfo?: FromInfo,
      options?: {
        config?: Config;
        defaultWitness?: HexString;
        since?: PackedSince;
      }
    ): Promise<TransactionSkeletonType>;
    prepareSigningEntries(
      txSkeleton: TransactionSkeletonType,
      options: Options
    ): TransactionSkeletonType;
    setupOutputCell?: (
      txSkeleton: TransactionSkeletonType,
      outputCell: Cell,
      options: Options
    ) => Promise<TransactionSkeletonType>;
  };
}

/**
 * `infos` includes predefined and customized.
 */
let lockScriptInfos: {
  configHashCode: number;
  _predefinedInfos: LockScriptInfo[];
  _customInfos: LockScriptInfo[];
  infos: LockScriptInfo[];
} = {
  configHashCode: 0,
  _predefinedInfos: [],
  _customInfos: [],
  get infos(): LockScriptInfo[] {
    return [...this._predefinedInfos, ...this._customInfos];
  },
};

function resetLockScriptInfos(): void {
  lockScriptInfos.configHashCode = 0;
  lockScriptInfos._predefinedInfos = [];
  lockScriptInfos._customInfos = [];
}

function getLockScriptInfos() {
  return lockScriptInfos;
}

export function registerCustomLockScriptInfos(infos: LockScriptInfo[]): void {
  lockScriptInfos._customInfos = infos;
}

function generateLockScriptInfos({ config = undefined }: Options = {}): void {
  config = config || getConfig();

  // lazy load
  const getPredefinedInfos = () => {
    const secpTemplate = config!.SCRIPTS.SECP256K1_BLAKE160;
    const multisigTemplate = config!.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
    const acpTemplate = config!.SCRIPTS.ANYONE_CAN_PAY;

    const predefinedInfos: LockScriptInfo[] = [];

    if (secpTemplate) {
      predefinedInfos.push({
        code_hash: secpTemplate.CODE_HASH,
        hash_type: secpTemplate.HASH_TYPE,
        lockScriptInfo: secp256k1Blake160,
      });
    } else {
      defaultLogger(
        "warn",
        "SECP256K1_BLAKE160 script info not found in config!"
      );
    }

    if (multisigTemplate) {
      predefinedInfos.push({
        code_hash: multisigTemplate.CODE_HASH,
        hash_type: multisigTemplate.HASH_TYPE,
        lockScriptInfo: secp256k1Blake160Multisig,
      });
    } else {
      defaultLogger(
        "warn",
        "SECP256K1_BLAKE160_MULTISIG script info not found in config!"
      );
    }

    if (acpTemplate) {
      predefinedInfos.push({
        code_hash: acpTemplate.CODE_HASH,
        hash_type: acpTemplate.HASH_TYPE,
        lockScriptInfo: anyoneCanPay,
      });
    } else {
      defaultLogger("warn", "ANYONE_CAN_PAY script info not found in config!");
    }

    return predefinedInfos;
  };

  const configHashCode: number = utils.hashCode(
    Buffer.from(JSON.stringify(config!))
  );

  if (lockScriptInfos.infos.length === 0) {
    lockScriptInfos._predefinedInfos = getPredefinedInfos();
    lockScriptInfos.configHashCode = configHashCode;
  } else {
    if (configHashCode !== lockScriptInfos.configHashCode) {
      defaultLogger(`warn`, "`config` changed, regenerate lockScriptInfos!");
      lockScriptInfos._predefinedInfos = getPredefinedInfos();
      lockScriptInfos.configHashCode = configHashCode;
    }
  }
}

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
  amount: BIish,
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
  let _amount = toJSBI(amount);
  if (!toAddress) {
    throw new Error("You must provide a to address!");
  }

  const toScript: Script = parseAddress(toAddress, { config });
  const targetOutput: Cell = {
    cell_output: {
      capacity: "0x" + JSBI.BigInt(_amount).toString(16),
      lock: toScript,
      type: undefined,
    },
    data: "0x",
  };

  generateLockScriptInfos({ config });

  const targetLockScriptInfo:
    | LockScriptInfo
    | undefined = lockScriptInfos.infos.find((lockScriptInfo) => {
    return (
      lockScriptInfo.code_hash === toScript.code_hash &&
      lockScriptInfo.hash_type === toScript.hash_type
    );
  });

  if (
    targetLockScriptInfo &&
    "setupOutputCell" in targetLockScriptInfo.lockScriptInfo
  ) {
    txSkeleton = await targetLockScriptInfo.lockScriptInfo.setupOutputCell!(
      txSkeleton,
      targetOutput,
      {
        config,
      }
    );
  } else {
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push(targetOutput);
    });
  }

  txSkeleton = await injectCapacity(
    txSkeleton,
    fromInfos,
    _amount.toString(),
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
  amount: BIish,
  changeAddress?: Address,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
    LocktimePoolCellCollector = locktimePool.CellCollector,
    enableDeductCapacity = true,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    LocktimePoolCellCollector?: any;
    enableDeductCapacity?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  let _amount = toJSBI(amount.toString());
  let deductAmount = JSBI.BigInt(_amount);

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
  const minimalChangeCapacity: JSBI = toJSBI(
    minimalCellCapacityCompatible(changeCell)
  );
  let changeCapacity: JSBI = JSBI.BigInt(0);
  if (useLocktimeCellsFirst) {
    if (tipHeader) {
      const result = await locktimePool.injectCapacityWithoutChangeCompatible(
        txSkeleton,
        fromInfos,
        deductAmount.toString(),
        tipHeader,
        minimalChangeCapacity.toString(),
        {
          config,
          LocktimeCellCollector: LocktimePoolCellCollector,
          enableDeductCapacity,
        }
      );
      txSkeleton = result.txSkeleton;
      deductAmount = toJSBI(result.capacity);
      // if deductAmount > 0, changeCapacity must be 0
      changeCapacity = toJSBI(result.changeCapacity);
    }

    if (JSBI.greaterThan(deductAmount, JSBI.BigInt(0))) {
      const result = await _commonTransferCompatible(
        txSkeleton,
        fromInfos,
        deductAmount,
        minimalChangeCapacity,
        { config, enableDeductCapacity }
      );
      txSkeleton = result.txSkeleton;
      deductAmount = result.capacity;
      changeCapacity = result.changeCapacity;
    } else if (
      JSBI.equal(deductAmount, JSBI.BigInt(0)) &&
      JSBI.greaterThan(changeCapacity, JSBI.BigInt(0)) &&
      JSBI.lessThan(changeCapacity, minimalChangeCapacity)
    ) {
      const result = await _commonTransferCompatible(
        txSkeleton,
        fromInfos,
        JSBI.subtract(minimalChangeCapacity, changeCapacity),
        JSBI.BigInt(0),
        { config, enableDeductCapacity }
      );
      txSkeleton = result.txSkeleton;
      deductAmount = result.capacity;
      changeCapacity = result.changeCapacity;
    }
  } else {
    const result = await _commonTransferCompatible(
      txSkeleton,
      fromInfos,
      deductAmount,
      minimalChangeCapacity,
      { config, enableDeductCapacity }
    );
    txSkeleton = result.txSkeleton;
    deductAmount = result.capacity;
    changeCapacity = result.changeCapacity;

    if (tipHeader) {
      if (JSBI.greaterThan(deductAmount, JSBI.BigInt(0))) {
        const result = await locktimePool.injectCapacityWithoutChangeCompatible(
          txSkeleton,
          fromInfos,
          deductAmount.toString(),
          tipHeader,
          minimalChangeCapacity.toString(),
          {
            config,
            LocktimeCellCollector: LocktimePoolCellCollector,
            enableDeductCapacity,
          }
        );
        txSkeleton = result.txSkeleton;
        deductAmount = toJSBI(result.capacity);
        changeCapacity = toJSBI(result.changeCapacity);
      } else if (
        JSBI.equal(deductAmount, JSBI.BigInt(0)) &&
        JSBI.greaterThan(changeCapacity, JSBI.BigInt(0)) &&
        JSBI.lessThan(changeCapacity, minimalChangeCapacity)
      ) {
        const result = await locktimePool.injectCapacityWithoutChangeCompatible(
          txSkeleton,
          fromInfos,
          JSBI.subtract(minimalChangeCapacity, changeCapacity).toString(),
          tipHeader,
          0,
          {
            config,
            LocktimeCellCollector: LocktimePoolCellCollector,
            enableDeductCapacity,
          }
        );
        txSkeleton = result.txSkeleton;
        deductAmount = toJSBI(result.capacity);
        changeCapacity = toJSBI(result.changeCapacity);
      }
    }
  }

  if (JSBI.greaterThan(deductAmount, JSBI.BigInt(0))) {
    throw new Error("Not enough capacity in from infos!");
  }

  if (
    JSBI.greaterThan(changeCapacity, JSBI.BigInt(0)) &&
    JSBI.lessThan(changeCapacity, minimalChangeCapacity)
  ) {
    throw new Error("Not enough capacity in from infos for change!");
  }

  if (JSBI.greaterThan(changeCapacity, JSBI.BigInt(0))) {
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
  amount: BIish,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
    enableDeductCapacity = true,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    enableDeductCapacity?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  return injectCapacity(txSkeleton, fromInfos, amount, undefined, tipHeader, {
    config,
    useLocktimeCellsFirst,
    enableDeductCapacity,
  });
}

export function prepareSigningEntries(
  txSkeleton: TransactionSkeletonType,
  { config = undefined }: Options = {}
): TransactionSkeletonType {
  config = config || getConfig();

  generateLockScriptInfos({ config });

  for (const lockScriptInfo of lockScriptInfos.infos) {
    txSkeleton = lockScriptInfo.lockScriptInfo.prepareSigningEntries(
      txSkeleton,
      { config }
    );
  }

  return txSkeleton;
}

async function _commonTransfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  minimalChangeCapacity: bigint,
  {
    config = undefined,
    enableDeductCapacity = true,
  }: Options & { enableDeductCapacity?: boolean } = {}
): Promise<{
  txSkeleton: TransactionSkeletonType;
  capacity: bigint;
  changeCapacity: bigint;
}> {
  const result = await _commonTransferCompatible(
    txSkeleton,
    fromInfos,
    JSBI.BigInt(amount.toString()),
    JSBI.BigInt(minimalChangeCapacity.toString()),
    {
      config,
      enableDeductCapacity,
    }
  );
  return {
    txSkeleton: result.txSkeleton,
    capacity: BigInt(result.capacity.toString()),
    changeCapacity: BigInt(result.changeCapacity.toString()),
  };
}

async function _commonTransferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: JSBI,
  minimalChangeCapacity: JSBI,
  {
    config = undefined,
    enableDeductCapacity = true,
  }: Options & { enableDeductCapacity?: boolean } = {}
): Promise<{
  txSkeleton: TransactionSkeletonType;
  capacity: JSBI;
  changeCapacity: JSBI;
}> {
  config = config || getConfig();
  amount = JSBI.BigInt(amount);

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
    if (enableDeductCapacity && JSBI.greaterThan(amount, JSBI.BigInt(0))) {
      [txSkeleton, amount] = _deductCapacityCompatible(
        txSkeleton,
        fromScript,
        amount
      );
    }
  }

  generateLockScriptInfos({ config });

  let changeCapacity: JSBI = JSBI.BigInt(0);

  if (JSBI.greaterThan(amount, JSBI.BigInt(0))) {
    // collect cells
    loop1: for (const fromInfo of fromInfos) {
      const cellCollectors = lockScriptInfos.infos.map((lockScriptInfo) => {
        return new lockScriptInfo.lockScriptInfo.CellCollector(
          fromInfo,
          cellProvider,
          {
            config,
          }
        );
      });

      for (const cellCollector of cellCollectors) {
        for await (const inputCell of cellCollector.collect()) {
          const inputKey: string = getInputKey(inputCell);
          if (previousInputs.has(inputKey)) {
            continue;
          }
          previousInputs = previousInputs.add(inputKey);
          const result = await collectInputCompatible(
            txSkeleton,
            inputCell,
            fromInfo,
            {
              config,
              needCapacity: amount,
            }
          );
          txSkeleton = result.txSkeleton;

          const inputCapacity: JSBI = JSBI.BigInt(result.availableCapacity);
          let deductCapacity: JSBI = inputCapacity;
          if (JSBI.greaterThan(deductCapacity, amount)) {
            deductCapacity = amount;
          }
          amount = JSBI.subtract(amount, deductCapacity);
          changeCapacity = JSBI.add(
            changeCapacity,
            JSBI.subtract(inputCapacity, deductCapacity)
          );

          if (
            JSBI.equal(amount, JSBI.BigInt(0)) &&
            (JSBI.equal(changeCapacity, JSBI.BigInt(0)) ||
              JSBI.greaterThan(changeCapacity, minimalChangeCapacity))
          ) {
            break loop1;
          }
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

function _deductCapacityCompatible(
  txSkeleton: TransactionSkeletonType,
  fromScript: Script,
  capacity: JSBI
): [TransactionSkeletonType, JSBI] {
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
  for (
    ;
    i < txSkeleton.get("outputs").size &&
    JSBI.greaterThan(capacity, JSBI.BigInt(0));
    i++
  ) {
    const output = txSkeleton.get("outputs").get(i)!;
    if (
      new ScriptValue(output.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const clonedOutput: Cell = JSON.parse(JSON.stringify(output));
      const cellCapacity = JSBI.BigInt(clonedOutput.cell_output.capacity);
      const availableCapacity: JSBI = cellCapacity;
      let deductCapacity;
      if (JSBI.greaterThanOrEqual(capacity, availableCapacity)) {
        deductCapacity = availableCapacity;
      } else {
        deductCapacity = JSBI.subtract(
          cellCapacity,
          toJSBI(minimalCellCapacityCompatible(clonedOutput))
        );
        if (JSBI.greaterThan(deductCapacity, capacity)) {
          deductCapacity = capacity;
        }
      }
      capacity = JSBI.subtract(capacity, deductCapacity);
      clonedOutput.cell_output.capacity =
        "0x" + JSBI.subtract(cellCapacity, deductCapacity).toString(16);

      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.update(i, () => clonedOutput);
      });
    }
  }
  // Remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) =>
        JSBI.BigInt(output.cell_output.capacity).toString() !==
        JSBI.BigInt(0).toString()
    );
  });

  return [txSkeleton, capacity];
}

// Alter output generated by `setupInputCell`
async function collectInputCompatible(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  fromInfo?: FromInfo,
  {
    config = undefined,
    since = undefined,
    defaultWitness = "0x",
    needCapacity = undefined,
  }: Options & {
    defaultWitness?: HexString;
    since?: PackedSince;
    needCapacity?: JSBI;
  } = {}
): Promise<{
  txSkeleton: TransactionSkeletonType;
  availableCapacity: JSBI;
}> {
  config = config || getConfig();

  txSkeleton = await setupInputCell(txSkeleton, inputCell, fromInfo, {
    config,
    since,
    defaultWitness,
  });

  const lastOutputIndex: number = txSkeleton.get("outputs").size - 1;
  const lastOutput: Cell = txSkeleton.get("outputs").get(lastOutputIndex)!;
  const lastOutputCapacity: JSBI = JSBI.BigInt(lastOutput.cell_output.capacity);
  const lastOutputFixedEntryIndex: number = txSkeleton
    .get("fixedEntries")
    .findIndex((fixedEntry) => {
      return (
        fixedEntry.field === "outputs" && fixedEntry.index === lastOutputIndex
      );
    });
  const fromScript: Script = inputCell.cell_output.lock;

  let availableCapacity: JSBI = JSBI.BigInt(0);
  if (config.SCRIPTS.ANYONE_CAN_PAY && isAcpScript(fromScript, config)) {
    const destroyable: boolean = !!(
      fromInfo &&
      typeof fromInfo === "object" &&
      "destroyable" in fromInfo &&
      fromInfo.destroyable
    );
    needCapacity = needCapacity || lastOutputCapacity;

    if (destroyable) {
      availableCapacity = lastOutputCapacity;
      // remove output & fixedEntry added by `setupInputCell`
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.remove(lastOutputIndex);
      });
      if (lastOutputFixedEntryIndex >= 0) {
        txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
          return fixedEntries.remove(lastOutputFixedEntryIndex);
        });
      }
    } else {
      // Ignore `fixedEntries` and update capacity of output which generated by `setupInputCell`
      const minimalOutputCapacity: JSBI = toJSBI(
        minimalCellCapacityCompatible(lastOutput)
      );
      const canUseCapacity = JSBI.subtract(
        lastOutputCapacity,
        minimalOutputCapacity
      );
      const clonedLastOutput: Cell = JSON.parse(JSON.stringify(lastOutput));
      let outputCapacity: JSBI = minimalOutputCapacity;
      availableCapacity = canUseCapacity;
      if (JSBI.lessThan(needCapacity, canUseCapacity)) {
        outputCapacity = JSBI.subtract(lastOutputCapacity, needCapacity);
        availableCapacity = needCapacity;
      }
      clonedLastOutput.cell_output.capacity =
        "0x" + outputCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.update(lastOutputIndex, () => clonedLastOutput);
      });
    }
  } else {
    // Ignore if last output is fixed.
    if (lastOutputFixedEntryIndex < 0) {
      // Remove last output
      availableCapacity = JSBI.BigInt(
        txSkeleton.get("outputs").get(lastOutputIndex)!.cell_output.capacity
      );
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.remove(lastOutputIndex);
      });
    }
  }

  return {
    txSkeleton,
    availableCapacity,
  };
}

/**
 * A function to transfer input to output, and add input & output to txSkeleton.
 * And it will deal with cell deps and witnesses too. (Add the input required cell deps and witnesses.)
 * It should be noted that the output must be added to the end of txSkeleton.get("outputs").
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
    since = undefined,
    defaultWitness = undefined,
  }: Options & {
    since?: PackedSince;
    defaultWitness?: HexString;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  generateLockScriptInfos({ config });
  const inputLock = inputCell.cell_output.lock;

  const targetLockScriptInfo:
    | LockScriptInfo
    | undefined = lockScriptInfos.infos.find((lockScriptInfo) => {
    return (
      lockScriptInfo.code_hash === inputLock.code_hash &&
      lockScriptInfo.hash_type === inputLock.hash_type
    );
  });

  if (!targetLockScriptInfo) {
    throw new Error(`No LockScriptInfo found for setupInputCell!`);
  }

  return targetLockScriptInfo.lockScriptInfo.setupInputCell(
    txSkeleton,
    inputCell,
    fromInfo,
    {
      config,
      since,
      defaultWitness,
    }
  );
}

export async function payFeeByFeeRate(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  feeRate: BIish,
  tipHeader?: Header,
  {
    config = undefined,
    useLocktimeCellsFirst = true,
    enableDeductCapacity = true,
  }: {
    config?: Config;
    useLocktimeCellsFirst?: boolean;
    enableDeductCapacity?: boolean;
  } = {}
): Promise<TransactionSkeletonType> {
  let size: number = 0;
  let newTxSkeleton: TransactionSkeletonType = txSkeleton;

  /**
   * Only one case `currentTransactionSize < size` :
   * change output capacity equals current fee (feeA), so one output reduced,
   * and if reduce the fee, change output will add again, fee will increase to feeA.
   */
  let currentTransactionSize: number = getTransactionSize(newTxSkeleton);
  while (currentTransactionSize > size) {
    size = currentTransactionSize;
    const fee: BI = calculateFeeCompatible(size, feeRate);

    newTxSkeleton = await payFee(txSkeleton, fromInfos, fee, tipHeader, {
      config,
      useLocktimeCellsFirst,
      enableDeductCapacity,
    });
    currentTransactionSize = getTransactionSize(newTxSkeleton);
  }

  return newTxSkeleton;
}

function calculateFee(size: number, feeRate: bigint): bigint {
  const result = calculateFeeCompatible(size, feeRate);
  return BigInt(result.toString());
}

function calculateFeeCompatible(size: number, feeRate: BIish): BI {
  const ratio = JSBI.BigInt(1000);
  const base = JSBI.multiply(JSBI.BigInt(size), toJSBI(feeRate));
  const fee = JSBI.divide(base, ratio);
  if (JSBI.lessThan(JSBI.multiply(fee, ratio), base)) {
    return BI.from(JSBI.add(fee, JSBI.BigInt(1)));
  }
  return BI.from(fee);
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

export default {
  transfer,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
  registerCustomLockScriptInfos,
  payFeeByFeeRate,
  __tests__: {
    _commonTransfer,
    resetLockScriptInfos,
    getLockScriptInfos,
    generateLockScriptInfos,
    getTransactionSizeByTx,
    getTransactionSize,
    calculateFee,
    calculateFeeCompatible,
  },
};
