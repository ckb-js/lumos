import {
  parseAddress,
  minimalCellCapacity,
  TransactionSkeletonType,
  Options,
  generateAddress,
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
} from "@ckb-lumos/base";
import { getConfig, Config } from "@ckb-lumos/config-manager";
const { toBigUInt64LE, readBigUInt64LE } = utils;
const { parseSince } = sinceUtils;
import { normalizers, Reader, RPC } from "ckb-js-toolkit";
import secp256k1Blake160 from "./secp256k1_blake160";
import secp256k1Blake160Multisig from "./secp256k1_blake160_multisig";
import { FromInfo } from "./from_info";
import {
  addCellDep,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
  generateDaoScript,
} from "./helper";

const DEPOSIT_DAO_DATA: HexString = "0x0000000000000000";
const DAO_LOCK_PERIOD_EPOCHS: bigint = BigInt(180);

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
  amount: bigint,
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
        capacity: "0x" + BigInt(amount).toString(16),
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
  config = config || getConfig();
  const fromScript = parseAddress(fromAddress, { config });
  const daoTypeScript = generateDaoScript(config);
  let data: HexString | undefined;
  if (cellType === "deposit") {
    data = DEPOSIT_DAO_DATA;
  }
  const cellCollector = cellProvider.collector({
    lock: fromScript,
    type: daoTypeScript,
    data,
  });
  for await (const inputCell of cellCollector.collect()) {
    if (cellType === "withdraw" && inputCell.data === DEPOSIT_DAO_DATA) {
      continue;
    }

    yield inputCell;
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

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: fromInput.cell_output.capacity,
        lock: fromInput.cell_output.lock,
        type: fromInput.cell_output.type,
      },
      data: toBigUInt64LE(BigInt(fromInput.block_number!)),
      out_point: undefined,
      block_hash: undefined,
    });
  });

  // setup input cell
  const fromLockScript = fromInput.cell_output.lock;
  if (isSecp256k1Blake160Script(fromLockScript, config)) {
    txSkeleton = secp256k1Blake160.setupInputCell(
      txSkeleton,
      fromInput,
      undefined,
      { config }
    ).txSkeleton;
  } else if (isSecp256k1Blake160MultisigScript(fromLockScript, config)) {
    txSkeleton = secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      fromInput,
      fromInfo || generateAddress(fromLockScript, { config }),
      { config }
    ).txSkeleton;
  }

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
  { config = undefined }: Options = {}
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
  const rpc = new RPC(cellProvider.uri!);

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

  // TODO: check depositInput and withdrawInput match

  // calculate since & capacity (interest)
  const depositBlockHeader = await rpc.get_header(depositInput.block_hash);
  const depositEpoch = parseEpoch(BigInt(depositBlockHeader.epoch));
  // const depositCapacity = BigInt(depositInput.cell_output.capacity)

  const withdrawBlockHeader = await rpc.get_header(withdrawInput.block_hash);
  const withdrawEpoch = parseEpoch(BigInt(withdrawBlockHeader.epoch));

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
  const outputCapacity = await rpc.calculate_dao_maximum_withdraw(
    depositInput.out_point,
    withdrawBlockHeader.hash
  );

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

  // setup input cell
  const fromLockScript = withdrawInput.cell_output.lock;
  if (isSecp256k1Blake160Script(fromLockScript, config)) {
    txSkeleton = secp256k1Blake160.setupInputCell(
      txSkeleton,
      withdrawInput,
      undefined,
      { config, since }
    ).txSkeleton;
  } else if (isSecp256k1Blake160MultisigScript(fromLockScript, config)) {
    txSkeleton = secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      withdrawInput,
      fromInfo || generateAddress(fromLockScript, { config }),
      { config, since }
    ).txSkeleton;
  }

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

  // add an empty witness
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    const witnessArgs: WitnessArgs = {
      input_type: toBigUInt64LE(BigInt(depositHeaderDepIndex)),
    };
    return witnesses.push(
      new Reader(
        core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(witnessArgs))
      ).serializeJson()
    );
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

export default {
  deposit,
  listDaoCells,
  withdraw,
  unlock,
  calculateMaximumWithdraw,
  calculateDaoEarliestSince,
};
