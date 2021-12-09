import {
  parseAddress,
  minimalCellCapacity,
  TransactionSkeletonType,
  Options,
  generateAddress,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import {
  core,
  utils,
  since as sinceUtils,
  HexString,
  Address,
  CellProvider,
  Cell,
  WitnessArgs,
  PackedDao,
  PackedSince,
  CellCollector as CellCollectorInterface,
  JSBI,
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
const { toBigUInt64LE, readBigUInt64LE } = utils;
const { parseSince } = sinceUtils;
import { normalizers, Reader } from "ckb-js-toolkit";
import secp256k1Blake160 from "./secp256k1_blake160";
import secp256k1Blake160Multisig from "./secp256k1_blake160_multisig";
import { FromInfo, parseFromInfo } from "./from_info";
import {
  addCellDep,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
  generateDaoScript,
} from "./helper";
import { RPC } from "@ckb-lumos/rpc";
import { readBigUInt64LECompatible } from "@ckb-lumos/base/lib/utils";

const DEPOSIT_DAO_DATA: HexString = "0x0000000000000000";
const DAO_LOCK_PERIOD_EPOCHS: bigint = BigInt(180);
const DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE = JSBI.BigInt(180);

export class CellCollector implements CellCollectorInterface {
  private cellCollector: CellCollectorInterface;
  private cellType: "all" | "deposit" | "withdraw";

  constructor(
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    cellType: "all" | "deposit" | "withdraw",
    { config = undefined }: Options = {}
  ) {
    if (!cellProvider) {
      throw new Error("Cell Provider is missing!");
    }

    config = config || getConfig();

    const fromScript = parseFromInfo(fromInfo, { config }).fromScript;
    const daoTypeScript = generateDaoScript(config);
    const data: HexString | string =
      cellType === "deposit" ? DEPOSIT_DAO_DATA : "any";
    this.cellType = cellType;

    this.cellCollector = cellProvider.collector({
      lock: fromScript,
      type: daoTypeScript,
      data,
    });
  }

  async *collect(): AsyncGenerator<Cell> {
    for await (const inputCell of this.cellCollector.collect()) {
      if (this.cellType === "withdraw" && inputCell.data === DEPOSIT_DAO_DATA) {
        continue;
      }

      yield inputCell;
    }
  }
}

/**
 * list DAO cells,
 *
 * @param cellProvider
 * @param fromAddress
 * @param cellType
 * @param options
 */
export async function* listDaoCells(
  cellProvider: CellProvider,
  fromAddress: Address,
  cellType: "all" | "deposit" | "withdraw",
  { config = undefined }: Options = {}
): AsyncIterator<Cell> {
  const collector = new CellCollector(fromAddress, cellProvider, cellType, {
    config,
  });

  for await (const cell of collector.collect()) {
    yield cell;
  }
}

// TODO: reject multisig with non absolute-epoch-number locktime lock
/**
 * deposit a cell to DAO
 *
 * @param txSkeleton
 * @param fromInfo
 * @param toAddress deposit cell lock address
 * @param amount capacity in shannon
 * @param options
 */
export async function deposit(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address,
  amount: bigint|JSBI,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (!DAO_SCRIPT) {
    throw new Error("Provided config does not have DAO script setup!");
  }

  _checkFromInfoSince(fromInfo, config);

  // check and add cellDep if not exists
  txSkeleton = _addDaoCellDep(txSkeleton, config);

  if (!toAddress) {
    throw new Error("You must provide a to address!");
  }

  const toScript = parseAddress(toAddress, { config });
  const daoTypeScript = {
    code_hash: DAO_SCRIPT.CODE_HASH,
    hash_type: DAO_SCRIPT.HASH_TYPE,
    args: "0x",
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: "0x" + JSBI.BigInt(amount.toString()).toString(16),
        lock: toScript,
        type: daoTypeScript,
      },
      data: DEPOSIT_DAO_DATA,
      out_point: undefined,
      block_hash: undefined,
    });
  });

  const outputIndex = txSkeleton.get("outputs").size - 1;

  // fix entry
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: outputIndex,
    });
  });

  if (typeof fromInfo === "string") {
    const fromScript = parseAddress(fromInfo, { config });
    // address
    if (isSecp256k1Blake160Script(fromScript, config)) {
      txSkeleton = await secp256k1Blake160.injectCapacity(
        txSkeleton,
        outputIndex,
        fromInfo,
        { config }
      );
    } else if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
      txSkeleton = await secp256k1Blake160Multisig.injectCapacity(
        txSkeleton,
        outputIndex,
        fromInfo,
        { config }
      );
    }
  } else if (fromInfo) {
    txSkeleton = await secp256k1Blake160Multisig.injectCapacity(
      txSkeleton,
      outputIndex,
      fromInfo,
      { config }
    );
  }

  return txSkeleton;
}

function _checkFromInfoSince(fromInfo: FromInfo, config: Config): void {
  let since;
  if (typeof fromInfo === "string") {
    // fromInfo is an address
    const fromScript = parseAddress(fromInfo, { config });
    const args = fromScript.args;
    if (args.length === 58) {
      since = "0x" + readBigUInt64LE("0x" + args.slice(42)).toString(16);
    }
  } else if ("R" in fromInfo) {
    since = fromInfo.since;
  }

  if (since != null) {
    const { relative, type } = parseSince(since);
    if (!(!relative && type === "epochNumber")) {
      throw new Error(
        "Can't deposit a dao cell with multisig locktime which not using absolute-epoch-number format!"
      );
    }
  }
}

/**
 * withdraw an deposited DAO cell
 *
 * @param txSkeleton
 * @param fromInput deposited DAO cell
 * @param fromInfo
 * @param options
 */
async function withdraw(
  txSkeleton: TransactionSkeletonType,
  fromInput: Cell,
  fromInfo?: FromInfo,
  { config = undefined }: Options = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  _checkDaoScript(config);
  txSkeleton = _addDaoCellDep(txSkeleton, config);

  // check inputs.size == outputs.size
  if (txSkeleton.get("inputs").size !== txSkeleton.get("outputs").size) {
    throw new Error("Input size must equals to output size in txSkeleton!");
  }

  if (!config.SCRIPTS.DAO) {
    throw new Error("Provided config does not have DAO script setup!");
  }

  // TODO: check fromInput

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }
  const typeScript = fromInput.cell_output.type;
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (
    !typeScript ||
    typeScript.code_hash !== DAO_SCRIPT.CODE_HASH ||
    typeScript.hash_type !== DAO_SCRIPT.HASH_TYPE ||
    fromInput.data !== DEPOSIT_DAO_DATA
  ) {
    throw new Error("fromInput is not a DAO deposit cell.");
  }

  // setup input cell
  const fromLockScript = fromInput.cell_output.lock;
  if (isSecp256k1Blake160Script(fromLockScript, config)) {
    txSkeleton = await secp256k1Blake160.setupInputCell(
      txSkeleton,
      fromInput,
      undefined,
      {
        config,
      }
    );
  } else if (isSecp256k1Blake160MultisigScript(fromLockScript, config)) {
    txSkeleton = await secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      fromInput,
      fromInfo || generateAddress(fromLockScript, { config }),
      { config }
    );
  }

  const targetOutputIndex: number = txSkeleton.get("outputs").size - 1;
  const targetOutput: Cell = txSkeleton.get("outputs").get(targetOutputIndex)!;
  const clonedTargetOutput: Cell = JSON.parse(JSON.stringify(targetOutput));
  clonedTargetOutput.data = toBigUInt64LE(JSBI.BigInt(fromInput.block_number!));
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.update(targetOutputIndex, () => clonedTargetOutput);
  });

  // add header deps
  txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
    return headerDeps.push(fromInput.block_hash!);
  });

  // fix inputs / outputs / witnesses
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push(
      {
        field: "inputs",
        index: txSkeleton.get("inputs").size - 1,
      },
      {
        field: "outputs",
        index: txSkeleton.get("outputs").size - 1,
      }
    );
  });

  return txSkeleton;
}

// epoch: bigint
function parseEpoch(
  epoch: bigint
): {
  length: bigint;
  index: bigint;
  number: bigint;
} {
  return {
    length: (epoch >> BigInt(40)) & BigInt(0xffff),
    index: (epoch >> BigInt(24)) & BigInt(0xffff),
    number: epoch & BigInt(0xffffff),
  };
}

function parseEpochCompatible(epoch: JSBI): {
  length: JSBI;
  index: JSBI;
  number: JSBI;
} {
  return {
    length: JSBI.bitwiseAnd(JSBI.signedRightShift(epoch, JSBI.BigInt(40)), JSBI.BigInt(0xffff)),
    index: JSBI.bitwiseAnd(JSBI.signedRightShift(epoch, JSBI.BigInt(24)), JSBI.BigInt(0xffff)),
    number: JSBI.bitwiseAnd(epoch, JSBI.BigInt(0xffffff))
  };
}

function epochSince({
  length,
  index,
  number,
}: {
  length: bigint;
  index: bigint;
  number: bigint;
}): bigint {
  return (
    (BigInt(0x20) << BigInt(56)) +
    (length << BigInt(40)) +
    (index << BigInt(24)) +
    number
  );
}

function epochSinceCompatible({
  length,
  index,
  number
}: {
  length: JSBI;
  index: JSBI;
  number: JSBI;
}): JSBI {
  return JSBI.add(JSBI.add(JSBI.add(JSBI.leftShift(JSBI.BigInt(0x20), JSBI.BigInt(56)), JSBI.leftShift(length, JSBI.BigInt(40))), JSBI.leftShift(index, JSBI.BigInt(24))), number);
}

/**
 * Unlock a withdrew DAO cell
 *
 * @param txSkeleton
 * @param depositInput deposited DAO cell
 * @param withdrawInput withdrew DAO cell
 * @param toAddress
 * @param fromInfo
 * @param options
 */
export async function unlock(
  txSkeleton: TransactionSkeletonType,
  depositInput: Cell,
  withdrawInput: Cell,
  toAddress: Address,
  fromInfo: FromInfo,
  {
    config = undefined,
    RpcClient = RPC,
  }: Options & { RpcClient?: typeof RPC } = {}
) {
  config = config || getConfig();
  _checkDaoScript(config);
  txSkeleton = _addDaoCellDep(txSkeleton, config);

  if (!config.SCRIPTS.DAO) {
    throw new Error("Provided config does not have DAO script setup!");
  }

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }
  const rpc = new RpcClient(cellProvider.uri!);

  const typeScript = depositInput.cell_output.type;
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (
    !typeScript ||
    typeScript.code_hash !== DAO_SCRIPT.CODE_HASH ||
    typeScript.hash_type !== DAO_SCRIPT.HASH_TYPE ||
    depositInput.data !== DEPOSIT_DAO_DATA
  ) {
    throw new Error("depositInput is not a DAO deposit cell.");
  }

  const withdrawTypeScript = withdrawInput.cell_output.type;
  if (
    !withdrawTypeScript ||
    withdrawTypeScript.code_hash !== DAO_SCRIPT.CODE_HASH ||
    withdrawTypeScript.hash_type !== DAO_SCRIPT.HASH_TYPE ||
    withdrawInput.data === DEPOSIT_DAO_DATA
  ) {
    throw new Error("withdrawInput is not a DAO withdraw cell.");
  }

  // calculate since & capacity (interest)
  const depositBlockHeader = await rpc.get_header(depositInput.block_hash!);
  const depositEpoch = parseEpochCompatible(JSBI.BigInt(depositBlockHeader!.epoch));
  // const depositCapacity = BigInt(depositInput.cell_output.capacity)

  const withdrawBlockHeader = await rpc.get_header(withdrawInput.block_hash!);
  const withdrawEpoch = parseEpochCompatible(JSBI.BigInt(withdrawBlockHeader!.epoch));


  const withdrawFraction = JSBI.multiply(withdrawEpoch.index, depositEpoch.length);
  const depositFraction = JSBI.multiply(depositEpoch.index, withdrawEpoch.length);
  let depositedEpochs = JSBI.subtract(withdrawEpoch.number, depositEpoch.number);

  if (JSBI.greaterThan(withdrawFraction, depositFraction)) {
    depositedEpochs = JSBI.add(depositedEpochs, JSBI.BigInt(1));
  }
  const lockEpochs = JSBI.multiply(JSBI.divide(JSBI.add(depositedEpochs, JSBI.subtract(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE, JSBI.BigInt(1))), DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE), DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE);
  const minimalSinceEpoch = {
    number: JSBI.add(depositEpoch.number, lockEpochs),
    index: depositEpoch.index,
    length: depositEpoch.length,
  };
  const minimalSince = epochSinceCompatible(minimalSinceEpoch);

  const outputCapacity: HexString =
    "0x" +
    calculateMaximumWithdraw(
      withdrawInput,
      depositBlockHeader!.dao,
      withdrawBlockHeader!.dao
    ).toString(16);

  const toScript = parseAddress(toAddress, { config });
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: outputCapacity,
        lock: toScript,
        type: undefined,
      },
      data: "0x",
      out_point: undefined,
      block_hash: undefined,
    });
  });

  const since: PackedSince = "0x" + minimalSince.toString(16);

  while (txSkeleton.get("witnesses").size < txSkeleton.get("inputs").size - 1) {
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.push("0x")
    );
  }

  // add header deps
  txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
    return headerDeps.push(depositInput.block_hash!, withdrawInput.block_hash!);
  });

  const depositHeaderDepIndex = txSkeleton.get("headerDeps").size - 2;

  // setup input cell
  const defaultWitnessArgs: WitnessArgs = {
    input_type: toBigUInt64LE(JSBI.BigInt(depositHeaderDepIndex)),
  };
  const defaultWitness: HexString = new Reader(
    core.SerializeWitnessArgs(
      normalizers.NormalizeWitnessArgs(defaultWitnessArgs)
    )
  ).serializeJson();
  const fromLockScript = withdrawInput.cell_output.lock;
  if (isSecp256k1Blake160Script(fromLockScript, config)) {
    txSkeleton = await secp256k1Blake160.setupInputCell(
      txSkeleton,
      withdrawInput,
      undefined,
      { config, since, defaultWitness }
    );
  } else if (isSecp256k1Blake160MultisigScript(fromLockScript, config)) {
    txSkeleton = await secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      withdrawInput,
      fromInfo || generateAddress(fromLockScript, { config }),
      { config, since, defaultWitness }
    );
  }
  // remove change output by setupInputCell
  const lastOutputIndex: number = txSkeleton.get("outputs").size - 1;
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.remove(lastOutputIndex);
  });

  // fix inputs / outputs / witnesses
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push(
      {
        field: "inputs",
        index: txSkeleton.get("inputs").size - 1,
      },
      {
        field: "outputs",
        index: txSkeleton.get("outputs").size - 1,
      },
      {
        field: "witnesses",
        index: txSkeleton.get("witnesses").size - 1,
      },
      {
        field: "headerDeps",
        index: txSkeleton.get("headerDeps").size - 2,
      }
    );
  });

  return txSkeleton;
}

/**
 * calculate a withdraw dao cell minimal unlock since
 *
 * @param depositBlockHeaderEpoch depositBlockHeader.epoch
 * @param withdrawBlockHeaderEpoch withdrawBlockHeader.epoch
 */
export function calculateDaoEarliestSince(
  depositBlockHeaderEpoch: HexString,
  withdrawBlockHeaderEpoch: HexString
): bigint {
  const depositEpoch = parseEpoch(BigInt(depositBlockHeaderEpoch));
  const withdrawEpoch = parseEpoch(BigInt(withdrawBlockHeaderEpoch));

  const withdrawFraction = withdrawEpoch.index * depositEpoch.length;
  const depositFraction = depositEpoch.index * withdrawEpoch.length;
  let depositedEpochs = withdrawEpoch.number - depositEpoch.number;
  if (withdrawFraction > depositFraction) {
    depositedEpochs += BigInt(1);
  }
  const lockEpochs =
    ((depositedEpochs + (DAO_LOCK_PERIOD_EPOCHS - BigInt(1))) /
      DAO_LOCK_PERIOD_EPOCHS) *
    DAO_LOCK_PERIOD_EPOCHS;
  const minimalSinceEpoch = {
    number: depositEpoch.number + lockEpochs,
    index: depositEpoch.index,
    length: depositEpoch.length,
  };
  const minimalSince = epochSince(minimalSinceEpoch);

  return minimalSince;
}

/**
 * calculate a withdraw dao cell minimal unlock since
 *
 * @param depositBlockHeaderEpoch depositBlockHeader.epoch
 * @param withdrawBlockHeaderEpoch withdrawBlockHeader.epoch
 */
 export function calculateDaoEarliestSinceCompatible(
  depositBlockHeaderEpoch: HexString,
  withdrawBlockHeaderEpoch: HexString
): JSBI {
  const depositEpoch = parseEpochCompatible(JSBI.BigInt(depositBlockHeaderEpoch));
  const withdrawEpoch = parseEpochCompatible(JSBI.BigInt(withdrawBlockHeaderEpoch));
  const withdrawFraction = JSBI.multiply(withdrawEpoch.index, depositEpoch.length);
  const depositFraction = JSBI.multiply(depositEpoch.index, withdrawEpoch.length);
  let depositedEpochs = JSBI.subtract(withdrawEpoch.number, depositEpoch.number);

  if (JSBI.greaterThan(withdrawFraction, depositFraction)) {
    depositedEpochs = JSBI.add(depositedEpochs, JSBI.BigInt(1));
  }

  const lockEpochs = JSBI.multiply(JSBI.divide(JSBI.add(depositedEpochs, JSBI.subtract(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE, JSBI.BigInt(1))), DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE), DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE);
  const minimalSinceEpoch = {
    number:JSBI.add(depositEpoch.number, lockEpochs),
    index: depositEpoch.index,
    length: depositEpoch.length,
  };
  const minimalSince = epochSinceCompatible(minimalSinceEpoch);

  return minimalSince;
}

function _checkDaoScript(config: Config): void {
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (!DAO_SCRIPT) {
    throw new Error("Provided config does not have DAO script setup!");
  }
}

/**
 *
 * @param {TransactionSkeleton} txSkeleton
 * @param {any} config
 * @returns {TransactionSkeleton} txSkeleton
 */
function _addDaoCellDep(
  txSkeleton: TransactionSkeletonType,
  config: Config
): TransactionSkeletonType {
  const template = config.SCRIPTS.DAO!;
  return addCellDep(txSkeleton, {
    out_point: {
      tx_hash: template.TX_HASH,
      index: template.INDEX,
    },
    dep_type: template.DEP_TYPE,
  });
}

function extractDaoData(
  dao: PackedDao
): {
  [key: string]: bigint;
} {
  if (!/^(0x)?([0-9a-fA-F]){64}$/.test(dao)) {
    throw new Error("Invalid dao format!");
  }

  const len = 8 * 2;
  const hex = dao.startsWith("0x") ? dao.slice(2) : dao;

  return ["c", "ar", "s", "u"]
    .map((key, i) => {
      return {
        [key]: readBigUInt64LE("0x" + hex.slice(len * i, len * (i + 1))),
      };
    })
    .reduce((result, c) => ({ ...result, ...c }), {});
}

function extractDaoDataCompatible(
  dao: PackedDao
): {
  [key: string]: JSBI;
} {
  if (!/^(0x)?([0-9a-fA-F]){64}$/.test(dao)) {
    throw new Error("Invalid dao format!");
  }

  const len = 8 * 2;
  const hex = dao.startsWith("0x") ? dao.slice(2) : dao;

  return ["c", "ar", "s", "u"]
    .map((key, i) => {
      return {
        [key]: readBigUInt64LECompatible("0x" + hex.slice(len * i, len * (i + 1))),
      };
    })
    .reduce((result, c) => ({ ...result, ...c }), {});
}

/**
 * calculate maximum withdraw capacity when unlock
 *
 * @param withdrawCell withdrawCell or depositCell
 * @param depositDao depositBlockHeader.dao
 * @param withdrawDao withdrawBlockHeader.dao
 */
export function calculateMaximumWithdraw(
  withdrawCell: Cell,
  depositDao: PackedDao,
  withdrawDao: PackedDao
): bigint {
  const depositAR = extractDaoData(depositDao).ar;
  const withdrawAR = extractDaoData(withdrawDao).ar;

  const occupiedCapacity = minimalCellCapacity(withdrawCell);
  const outputCapacity = BigInt(withdrawCell.cell_output.capacity);
  const countedCapacity = outputCapacity - occupiedCapacity;
  const withdrawCountedCapacity = (countedCapacity * withdrawAR) / depositAR;

  return withdrawCountedCapacity + occupiedCapacity;
}

/**
 * calculate maximum withdraw capacity when unlock
 *
 * @param withdrawCell withdrawCell or depositCell
 * @param depositDao depositBlockHeader.dao
 * @param withdrawDao withdrawBlockHeader.dao
 */
 export function calculateMaximumWithdrawCompatible(
  withdrawCell: Cell,
  depositDao: PackedDao,
  withdrawDao: PackedDao
): JSBI {
  const depositAR = extractDaoDataCompatible(depositDao).ar;
  const withdrawAR = extractDaoDataCompatible(withdrawDao).ar;

  const occupiedCapacity = minimalCellCapacityCompatible(withdrawCell);
  const outputCapacity = JSBI.BigInt(withdrawCell.cell_output.capacity);
  const countedCapacity = JSBI.subtract(outputCapacity, occupiedCapacity);
  const withdrawCountedCapacity =JSBI.divide(JSBI.multiply(countedCapacity, withdrawAR), depositAR);

  return JSBI.add(withdrawCountedCapacity, occupiedCapacity);
}

export default {
  deposit,
  withdraw,
  unlock,
  calculateMaximumWithdraw,
  calculateMaximumWithdrawCompatible,
  calculateDaoEarliestSince,
  calculateDaoEarliestSinceCompatible,
  CellCollector,
  listDaoCells,
};
