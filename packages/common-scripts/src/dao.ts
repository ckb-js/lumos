import {
  parseAddress,
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
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
const { toBigUInt64LE, readBigUInt64LE } = utils;
const { parseSince } = sinceUtils;
import { normalizers, Reader } from "@ckb-lumos/toolkit";
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
import { BI, BIish } from "@ckb-lumos/bi";

const DEPOSIT_DAO_DATA: HexString = "0x0000000000000000";
const DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE = BI.from(180);

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
  amount: BIish,
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
        capacity: "0x" + BI.from(amount).toString(16),
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
  clonedTargetOutput.data = toBigUInt64LE(BI.from(fromInput.block_number));
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

function parseEpochCompatible(
  epoch: BIish
): {
  length: BI;
  index: BI;
  number: BI;
} {
  const _epoch = BI.from(epoch);
  return {
    length: _epoch.shr(40).and(0xfff),
    index: _epoch.shr(24).and(0xfff),
    number: _epoch.and(0xffffff),
  };
}

function epochSinceCompatible({
  length,
  index,
  number,
}: {
  length: BIish;
  index: BIish;
  number: BIish;
}): BI {
  const _length = BI.from(length);
  const _index = BI.from(index);
  const _number = BI.from(number);
  return BI.from(0x20)
    .shl(56)
    .add(_length.shl(40))
    .add(_index.shl(24))
    .add(_number);
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
  const depositEpoch = parseEpochCompatible(depositBlockHeader!.epoch);
  // const depositCapacity = BigInt(depositInput.cell_output.capacity)

  const withdrawBlockHeader = await rpc.get_header(withdrawInput.block_hash!);
  const withdrawEpoch = parseEpochCompatible(withdrawBlockHeader!.epoch);

  const withdrawFraction = withdrawEpoch.index.mul(depositEpoch.length);
  const depositFraction = depositEpoch.index.mul(withdrawEpoch.length);
  let depositedEpochs = withdrawEpoch.number.sub(depositEpoch.number);

  if (withdrawFraction.gt(depositFraction)) {
    depositedEpochs = depositedEpochs.add(1);
  }

  const lockEpochs = depositedEpochs
    .add(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE)
    .sub(1)
    .div(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE)
    .mul(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE);
  const minimalSinceEpoch = {
    number: BI.from(depositEpoch.number.add(lockEpochs)),
    index: BI.from(depositEpoch.index),
    length: BI.from(depositEpoch.length),
  };
  const minimalSince = epochSinceCompatible(minimalSinceEpoch);

  const outputCapacity: HexString =
    "0x" +
    calculateMaximumWithdrawCompatible(
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
    input_type: toBigUInt64LE(depositHeaderDepIndex),
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
  const result = calculateDaoEarliestSinceCompatible(
    depositBlockHeaderEpoch,
    withdrawBlockHeaderEpoch
  );
  return BigInt(result.toString());
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
): BI {
  const depositEpoch = parseEpochCompatible(depositBlockHeaderEpoch);
  const withdrawEpoch = parseEpochCompatible(withdrawBlockHeaderEpoch);
  const withdrawFraction = withdrawEpoch.index.mul(depositEpoch.length);
  const depositFraction = depositEpoch.index.mul(withdrawEpoch.length);
  let depositedEpochs = withdrawEpoch.number.sub(depositEpoch.number);

  if (withdrawFraction.gt(depositFraction)) {
    depositedEpochs = depositedEpochs.add(1);
  }

  const lockEpochs = depositedEpochs
    .add(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE)
    .sub(1)
    .div(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE)
    .mul(DAO_LOCK_PERIOD_EPOCHS_COMPATIBLE);
  const minimalSinceEpoch = {
    number: BI.from(depositEpoch.number.add(lockEpochs)),
    index: BI.from(depositEpoch.index),
    length: BI.from(depositEpoch.length),
  };
  return epochSinceCompatible(minimalSinceEpoch);
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

function extractDaoDataCompatible(
  dao: PackedDao
): {
  [key: string]: BI;
} {
  if (!/^(0x)?([0-9a-fA-F]){64}$/.test(dao)) {
    throw new Error("Invalid dao format!");
  }

  const len = 8 * 2;
  const hex = dao.startsWith("0x") ? dao.slice(2) : dao;

  return ["c", "ar", "s", "u"]
    .map((key, i) => {
      return {
        [key]: BI.from(
          readBigUInt64LECompatible("0x" + hex.slice(len * i, len * (i + 1)))
        ),
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
  return calculateMaximumWithdrawCompatible(
    withdrawCell,
    depositDao,
    withdrawDao
  ).toBigInt();
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
): BI {
  const depositAR = BI.from(extractDaoDataCompatible(depositDao).ar);
  const withdrawAR = BI.from(extractDaoDataCompatible(withdrawDao).ar);

  const occupiedCapacity = BI.from(minimalCellCapacityCompatible(withdrawCell));
  const outputCapacity = BI.from(withdrawCell.cell_output.capacity);
  const countedCapacity = outputCapacity.sub(occupiedCapacity);
  const withdrawCountedCapacity = countedCapacity
    .mul(withdrawAR)
    .div(depositAR);

  return withdrawCountedCapacity.add(occupiedCapacity);
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
