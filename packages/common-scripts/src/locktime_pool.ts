import {
  parseAddress,
  minimalCellCapacity,
  Options,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import {
  setupInputCell as setupMultisigInputCell,
  FromInfo,
  parseFromInfo,
} from "./secp256k1_blake160_multisig";
import { setupInputCell } from "./secp256k1_blake160";
import { calculateMaximumWithdraw, calculateDaoEarliestSince } from "./dao";
import {
  core,
  values,
  utils,
  since as sinceUtils,
  CellProvider,
  Script,
  PackedSince,
  Cell,
  Hash,
  HexString,
  Address,
  Header,
} from "@ckb-lumos/base";
const { toBigUInt64LE, readBigUInt64LE } = utils;
const { ScriptValue } = values;
import { normalizers, Reader, RPC } from "ckb-js-toolkit";
import {
  addCellDep,
  generateDaoScript,
  isSecp256k1Blake160MultisigScript,
  isSecp256k1Blake160Script,
  isDaoScript,
  prepareSigningEntries as _prepareSigningEntries,
} from "./helper";
const {
  parseSince,
  parseEpoch,
  maximumAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  validateSince,
} = sinceUtils;
import { List, Set } from "immutable";
import { getConfig, Config } from "@ckb-lumos/config-manager";

export interface SinceBaseValue {
  epoch: HexString;
  number: HexString;
  timestamp: HexString;
}

export interface LocktimeCell extends Cell {
  maximumCapacity: bigint;
  since: PackedSince;
  depositBlockHash?: Hash;
  withdrawBlockHash?: Hash;
  sinceBaseValue?: SinceBaseValue;
}

export async function* collectCells(
  cellProvider: CellProvider,
  fromInfo: FromInfo,
  {
    config = undefined,
    assertScriptSupported = true,
  }: Options & { assertScriptSupported?: boolean } = {}
): AsyncGenerator<LocktimeCell> {
  config = config || getConfig();
  const rpc = new RPC(cellProvider.uri!);

  const { fromScript } = parseFromInfo(fromInfo, { config });

  let cellCollectors = List();
  if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
    const lock: Script = {
      code_hash: fromScript.code_hash,
      hash_type: fromScript.hash_type,
      args: fromScript.args.slice(0, 42),
    };
    // multisig with locktime, not dao
    cellCollectors = cellCollectors.push(
      cellProvider.collector({
        lock,
        argsLen: 28,
        type: "empty",
        data: "0x",
      })
    );
    // multisig without locktime, dao
    cellCollectors = cellCollectors.push(
      cellProvider.collector({
        lock,
        type: generateDaoScript(config),
        data: undefined,
      })
    );
    // multisig with locktime, dao
    cellCollectors = cellCollectors.push(
      cellProvider.collector({
        lock,
        argsLen: 28,
        type: generateDaoScript(config),
        data: undefined,
      })
    );
  } else if (isSecp256k1Blake160Script(fromScript, config)) {
    // secp256k1_blake160, dao
    cellCollectors = cellCollectors.push(
      cellProvider.collector({
        lock: fromScript,
        type: generateDaoScript(config),
        data: undefined,
      })
    );
  } else {
    if (assertScriptSupported) {
      throw new Error("Non supported fromScript type!");
    }
  }

  for (const cellCollector of cellCollectors) {
    for await (const inputCell of cellCollector.collect()) {
      const lock = inputCell.cell_output.lock;

      let since: PackedSince | undefined;
      let maximumCapacity: bigint | undefined;
      let depositBlockHash: Hash | undefined;
      let withdrawBlockHash: Hash | undefined;
      let sinceBaseValue: SinceBaseValue | undefined;

      // multisig
      if (lock.args.length === 58) {
        const header = await rpc.get_header(inputCell.block_hash);
        since = "0x" + _parseMultisigArgsSince(lock.args).toString(16);
        sinceBaseValue = {
          epoch: header.epoch,
          number: header.number,
          timestamp: header.timestamp,
        };
      }

      // dao
      if (isDaoScript(inputCell.cell_output.type, config)) {
        if (inputCell.data === "0x0000000000000000") {
          continue;
        }
        const transactionWithStatus = await rpc.get_transaction(
          inputCell.out_point.tx_hash
        );
        withdrawBlockHash = transactionWithStatus.tx_status.block_hash;
        const transaction = transactionWithStatus.transaction;
        const depositOutPoint =
          transaction.inputs[+inputCell.out_point.index].previous_output;
        depositBlockHash = (await rpc.get_transaction(depositOutPoint.tx_hash))
          .tx_status.block_hash;
        const depositBlockHeader = await rpc.get_header(depositBlockHash);
        const withdrawBlockHeader = await rpc.get_header(withdrawBlockHash);
        let daoSince: PackedSince =
          "0x" +
          calculateDaoEarliestSince(
            depositBlockHeader.epoch,
            withdrawBlockHeader.epoch
          ).toString(16);
        maximumCapacity = calculateMaximumWithdraw(
          inputCell,
          depositBlockHeader.dao,
          withdrawBlockHeader.dao
        );
        const withdrawEpochValue = parseEpoch(withdrawBlockHeader.epoch);
        const fourEpochsLater = {
          number: withdrawEpochValue.number + 4,
          length: withdrawEpochValue.length,
          index: withdrawEpochValue.index,
        };
        daoSince = maximumAbsoluteEpochSince(
          daoSince,
          generateAbsoluteEpochSince(fourEpochsLater)
        );

        // if multisig with locktime
        if (since) {
          const multisigSince = parseSince(since);
          if (
            !(
              multisigSince.relative === false &&
              multisigSince.type === "epochNumber"
            )
          ) {
            // throw new Error(
            //   "Multisig since not an absolute-epoch-number since format!"
            // );
            // skip multisig with locktime in non-absolute-epoch-number format, can't unlock it
            continue;
          }

          try {
            since = maximumAbsoluteEpochSince(daoSince, since);
          } catch {
            since = daoSince;
          }
        } else {
          since = daoSince;
        }
      }

      yield {
        ...inputCell,
        maximumCapacity:
          maximumCapacity || BigInt(inputCell.cell_output.capacity),
        since,
        depositBlockHash: depositBlockHash,
        withdrawBlockHash: withdrawBlockHash,
        sinceBaseValue,
      };
    }
  }
}

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: bigint,
  tipHeader: Header,
  {
    config,
    requireToAddress,
    cellCollector,
    assertAmountEnough,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
    assertAmountEnough?: true;
  }
): Promise<TransactionSkeletonType>;

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: bigint,
  tipHeader: Header,
  {
    config,
    requireToAddress,
    cellCollector,
    assertAmountEnough,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
    assertAmountEnough: false;
  }
): Promise<[TransactionSkeletonType, bigint]>;

export async function transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: bigint,
  tipHeader: Header,
  {
    config = undefined,
    requireToAddress = true,
    cellCollector = collectCells,
    assertAmountEnough = true,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
    assertAmountEnough?: boolean;
  } = {}
): Promise<TransactionSkeletonType | [TransactionSkeletonType, bigint]> {
  amount = BigInt(amount);
  for (const [index, fromInfo] of fromInfos.entries()) {
    const value = (await _transfer(
      txSkeleton,
      fromInfo,
      index === 0 ? toAddress : undefined,
      amount,
      tipHeader,
      {
        config,
        requireToAddress: index === 0 ? requireToAddress : false,
        assertAmountEnough: false,
        cellCollector,
      }
    )) as [TransactionSkeletonType, bigint];
    // [txSkeleton, amount] = value
    txSkeleton = value[0];
    amount = value[1];

    if (amount === BigInt(0)) {
      if (assertAmountEnough) {
        return txSkeleton;
      }
      return [txSkeleton, amount];
    }
  }

  if (assertAmountEnough) {
    throw new Error("Not enough capacity in from addresses!");
  }
  return [txSkeleton, amount];
}

async function _transfer(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: bigint,
  tipHeader: Header,
  {
    config = undefined,
    requireToAddress = true,
    assertAmountEnough = true,
    cellCollector = collectCells,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: boolean;
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
  }
): Promise<TransactionSkeletonType | [TransactionSkeletonType, bigint]> {
  config = config || getConfig();
  // fromScript can be secp256k1_blake160 / secp256k1_blake160_multisig
  const { fromScript } = parseFromInfo(fromInfo, { config });

  // validate fromScript
  if (
    !isSecp256k1Blake160MultisigScript(fromScript, config) &&
    !isSecp256k1Blake160Script(fromScript, config)
  ) {
    throw new Error("fromInfo not supported!");
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
  if (amount > 0) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }

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
    const iter: AsyncIterable<LocktimeCell> = cellCollector(
      cellProvider,
      fromInfo,
      {
        config,
        assertScriptSupported: false,
      }
    );
    for await (const inputCell of iter) {
      if (
        !validateSince(
          inputCell.since,
          tipHeader,
          inputCell.sinceBaseValue as Header
        )
      ) {
        continue;
      }

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
      txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
        return inputSinces.set(
          txSkeleton.get("inputs").size - 1,
          inputCell.since
        );
      });
      if (isDaoScript(inputCell.cell_output.type, config)) {
        txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
          return headerDeps.push(
            inputCell.depositBlockHash!,
            inputCell.withdrawBlockHash!
          );
        });

        const depositHeaderDepIndex = txSkeleton.get("headerDeps").size - 2;

        txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
          const witnessArgs = {
            input_type: toBigUInt64LE(BigInt(depositHeaderDepIndex)),
          };
          return witnesses.push(
            new Reader(
              core.SerializeWitnessArgs(
                normalizers.NormalizeWitnessArgs(witnessArgs)
              )
            ).serializeJson()
          );
        });

        // add dao cell dep
        const template = config.SCRIPTS.DAO!;
        txSkeleton = addCellDep(txSkeleton, {
          dep_type: template.DEP_TYPE,
          out_point: {
            tx_hash: template.TX_HASH,
            index: template.INDEX,
          },
        });
      } else {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.push("0x")
        );
      }
      const inputCapacity = BigInt(inputCell.maximumCapacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > amount) {
        deductCapacity = amount;
      }
      amount -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;

      if (isSecp256k1Blake160Script(fromScript, config)) {
        txSkeleton = await setupInputCell(
          txSkeleton,
          txSkeleton.get("inputs").size - 1,
          { config }
        );
      } else {
        // multisig
        const inputSize = txSkeleton.get("inputs").size;
        const lockArgs = txSkeleton.get("inputs").get(inputSize - 1)!
          .cell_output.lock.args;
        const multisigSince =
          lockArgs.length === 58
            ? _parseMultisigArgsSince(lockArgs)
            : undefined;
        txSkeleton = await setupMultisigInputCell(
          txSkeleton,
          inputSize - 1,
          Object.assign({}, fromInfo, { since: multisigSince }),
          { config }
        );
      }

      if (isDaoScript(inputCell.cell_output.type, config)) {
        // fix inputs / outputs / witnesses
        txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
          return fixedEntries.push(
            {
              field: "inputs",
              index: txSkeleton.get("inputs").size - 1,
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
      }

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

  if (!assertAmountEnough) {
    return [txSkeleton, amount];
  }

  if (amount > 0) {
    throw new Error("Not enough capacity in from address!");
  }

  return txSkeleton;
}

export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  tipHeader: Header,
  {
    config = undefined,
    cellCollector = collectCells,
  }: {
    config?: Config;
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
  } = {}
): Promise<TransactionSkeletonType> {
  return transfer(txSkeleton, fromInfos, undefined, amount, tipHeader, {
    config,
    requireToAddress: false,
    cellCollector,
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
  return txSkeleton;
}

function _parseMultisigArgsSince(args: HexString): bigint {
  if (args.length !== 58) {
    throw new Error("Invalid multisig with since args!");
  }
  return readBigUInt64LE("0x" + args.slice(42));
}

export default {
  collectCells,
  transfer,
  payFee,
  prepareSigningEntries,
};
