import {
  parseAddress,
  minimalCellCapacity,
  Options,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { FromInfo, parseFromInfo } from "./from_info";
import secp256k1Blake160 from "./secp256k1_blake160";
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
  QueryOptions,
  CellCollector as CellCollectorType,
} from "@ckb-lumos/base";
const { toBigUInt64LE, readBigUInt64LE } = utils;
const { ScriptValue } = values;
import { normalizers, Reader, RPC } from "ckb-js-toolkit";
import {
  generateDaoScript,
  isSecp256k1Blake160MultisigScript,
  isSecp256k1Blake160Script,
  isDaoScript,
  prepareSigningEntries as _prepareSigningEntries,
  addCellDep,
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
import { secp256k1Blake160Multisig } from ".";

export interface SinceBaseValue {
  epoch: HexString;
  number: HexString;
  timestamp: HexString;
}

export interface LocktimeCell extends Cell {
  since: PackedSince;
  depositBlockHash?: Hash;
  withdrawBlockHash?: Hash;
  sinceBaseValue?: SinceBaseValue;
}

export class CellCollector implements CellCollectorType {
  private cellCollectors: List<CellCollectorType>;
  private config: Config;
  private rpc: RPC;
  private tipHeader?: Header;
  public readonly fromScript: Script;
  public readonly multisigScript?: HexString;

  constructor(
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config = undefined,
      queryOptions = {},
      tipHeader = undefined,
      NodeRPC = RPC,
    }: Options & {
      queryOptions?: QueryOptions;
      tipHeader?: Header;
      NodeRPC?: any;
    } = {}
  ) {
    if (!cellProvider) {
      throw new Error(`Cell provider is missing!`);
    }
    config = config || getConfig();
    const result = parseFromInfo(fromInfo, { config });
    const fromScript = result.fromScript;
    this.multisigScript = result.multisigScript;
    this.fromScript = fromScript;

    this.config = config;
    this.tipHeader = tipHeader;

    this.rpc = new NodeRPC(cellProvider.uri!);

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    let cellCollectors = List<CellCollectorType>([]);
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
          argsLen: queryOptions.argsLen || 28,
          type: queryOptions.type || "empty",
          data: queryOptions.data || "0x",
        })
      );
      // multisig without locktime, dao
      if (!queryOptions.type && !queryOptions.data) {
        cellCollectors = cellCollectors.push(
          cellProvider.collector({
            lock,
            type: generateDaoScript(config),
            data: "any",
          })
        );
        // multisig with locktime, dao
        cellCollectors = cellCollectors.push(
          cellProvider.collector({
            lock,
            argsLen: 28,
            type: generateDaoScript(config),
            data: "any",
          })
        );
      }
    } else if (isSecp256k1Blake160Script(fromScript, config)) {
      // secp256k1_blake160, dao
      if (!queryOptions.type && !queryOptions.data) {
        cellCollectors = cellCollectors.push(
          cellProvider.collector({
            lock: fromScript,
            type: generateDaoScript(config),
            data: "any",
          })
        );
      }
    }

    this.cellCollectors = cellCollectors;
  }

  async *collect(): AsyncGenerator<LocktimeCell> {
    for (const cellCollector of this.cellCollectors) {
      for await (const inputCell of cellCollector.collect()) {
        const lock = inputCell.cell_output.lock;

        let since: PackedSince | undefined;
        let maximumCapacity: bigint | undefined;
        let depositBlockHash: Hash | undefined;
        let withdrawBlockHash: Hash | undefined;
        let sinceBaseValue: SinceBaseValue | undefined;

        // multisig
        if (lock.args.length === 58) {
          const header = await this.rpc.get_header(inputCell.block_hash);
          since = "0x" + _parseMultisigArgsSince(lock.args).toString(16);
          sinceBaseValue = {
            epoch: header.epoch,
            number: header.number,
            timestamp: header.timestamp,
          };
        }

        // dao
        if (isDaoScript(inputCell.cell_output.type, this.config)) {
          if (inputCell.data === "0x0000000000000000") {
            continue;
          }
          const transactionWithStatus = await this.rpc.get_transaction(
            inputCell.out_point!.tx_hash
          );
          withdrawBlockHash = transactionWithStatus.tx_status.block_hash;
          const transaction = transactionWithStatus.transaction;
          const depositOutPoint =
            transaction.inputs[+inputCell.out_point!.index].previous_output;
          depositBlockHash = (
            await this.rpc.get_transaction(depositOutPoint.tx_hash)
          ).tx_status.block_hash;
          const depositBlockHeader = await this.rpc.get_header(
            depositBlockHash
          );
          const withdrawBlockHeader = await this.rpc.get_header(
            withdrawBlockHash
          );
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

        if (
          this.tipHeader &&
          !validateSince(since!, this.tipHeader, sinceBaseValue as Header)
        ) {
          continue;
        }

        const result = {
          ...inputCell,
          since: since!,
          depositBlockHash: depositBlockHash,
          withdrawBlockHash: withdrawBlockHash,
          sinceBaseValue,
        };
        result.cell_output.capacity =
          "0x" +
          (maximumCapacity || BigInt(inputCell.cell_output.capacity)).toString(
            16
          );

        yield result;
      }
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
    assertAmountEnough,
    LocktimeCellCollector,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: true;
    LocktimeCellCollector?: any;
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
    assertAmountEnough,
    LocktimeCellCollector,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough: false;
    LocktimeCellCollector?: any;
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
    assertAmountEnough = true,
    LocktimeCellCollector = CellCollector,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: boolean;
    LocktimeCellCollector?: any;
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
        LocktimeCellCollector,
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
    LocktimeCellCollector = CellCollector,
    changeAddress = undefined,
  }: {
    config?: Config;
    requireToAddress?: boolean;
    assertAmountEnough?: boolean;
    LocktimeCellCollector: any;
    changeAddress?: Address;
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

      const clonedOutput = JSON.parse(JSON.stringify(output));
      clonedOutput.cell_output.capacity =
        "0x" + (cellCapacity - deductCapacity).toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.update(i, () => clonedOutput);
      });
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
  if (amount > 0n) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }

    const changeLockScript: Script = changeAddress
      ? parseAddress(changeAddress, { config })
      : fromScript;
    const changeCell: Cell = {
      cell_output: {
        capacity: "0x0",
        lock: changeLockScript,
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
    const cellCollector = new LocktimeCellCollector(fromInfo, cellProvider, {
      config,
      tipHeader,
    });
    for await (const inputCell of cellCollector.collect()) {
      // skip inputs already exists in txSkeleton.inputs
      if (
        previousInputs.has(
          `${inputCell.out_point!.tx_hash}_${inputCell.out_point!.index}`
        )
      ) {
        continue;
      }

      let multisigSince: bigint | undefined;
      if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
        const lockArgs = inputCell.cell_output.lock.args;
        multisigSince =
          lockArgs.length === 58
            ? _parseMultisigArgsSince(lockArgs)
            : undefined;
      }
      let witness: HexString = "0x";
      if (isDaoScript(inputCell.cell_output.type, config)) {
        const template = config.SCRIPTS.DAO!;
        txSkeleton = addCellDep(txSkeleton, {
          dep_type: template.DEP_TYPE,
          out_point: {
            tx_hash: template.TX_HASH,
            index: template.INDEX,
          },
        });

        txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
          return headerDeps.push(
            inputCell.depositBlockHash!,
            inputCell.withdrawBlockHash!
          );
        });

        const depositHeaderDepIndex = txSkeleton.get("headerDeps").size - 2;

        const witnessArgs = {
          input_type: toBigUInt64LE(BigInt(depositHeaderDepIndex)),
        };
        witness = new Reader(
          core.SerializeWitnessArgs(
            normalizers.NormalizeWitnessArgs(witnessArgs)
          )
        ).serializeJson();
      }

      txSkeleton = await collectInput(
        txSkeleton,
        inputCell,
        isSecp256k1Blake160MultisigScript(fromScript, config)
          ? Object.assign({}, fromInfo, { since: multisigSince })
          : fromInfo,
        { config, defaultWitness: witness, since: inputCell.since }
      );

      const inputCapacity = BigInt(inputCell.cell_output.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > amount) {
        deductCapacity = amount;
      }
      amount -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;

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

  if (amount > 0n) {
    throw new Error("Not enough capacity in from address!");
  }

  return txSkeleton;
}

async function injectCapacityWithoutChange(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  tipHeader: Header,
  minimalChangeCapacity: bigint,
  {
    config = undefined,
    LocktimeCellCollector = CellCollector,
  }: {
    config?: Config;
    LocktimeCellCollector?: any;
  }
): Promise<{
  txSkeleton: TransactionSkeletonType;
  capacity: bigint;
  changeCapacity: bigint;
}> {
  config = config || getConfig();
  // fromScript can be secp256k1_blake160 / secp256k1_blake160_multisig

  amount = BigInt(amount || 0);

  for (const fromInfo of fromInfos) {
    const fromScript: Script = parseFromInfo(fromInfo, { config }).fromScript;
    // validate fromScript
    if (
      !isSecp256k1Blake160MultisigScript(fromScript, config) &&
      !isSecp256k1Blake160Script(fromScript, config)
    ) {
      throw new Error("fromInfo not supported!");
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
        const clonedOutput: Cell = JSON.parse(JSON.stringify(output));
        const cellCapacity = BigInt(clonedOutput.cell_output.capacity);
        let deductCapacity;
        if (amount >= cellCapacity) {
          deductCapacity = cellCapacity;
        } else {
          deductCapacity = cellCapacity - minimalCellCapacity(clonedOutput);
          if (deductCapacity > amount) {
            deductCapacity = amount;
          }
        }
        amount -= deductCapacity;
        clonedOutput.cell_output.capacity =
          "0x" + (cellCapacity - deductCapacity).toString(16);

        txSkeleton = txSkeleton.update("outputs", (outputs) => {
          return outputs.update(i, () => clonedOutput);
        });
      }
    }
    // remove all output cells with capacity equal to 0
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.filter(
        (output) => BigInt(output.cell_output.capacity) !== BigInt(0)
      );
    });
  }

  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  let changeCapacity = BigInt(0);
  if (amount > 0n) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }

    const getInputKey = (input: Cell) =>
      `${input.out_point!.tx_hash}_${input.out_point!.index}`;
    let previousInputs = Set<string>();
    for (const input of txSkeleton.get("inputs")) {
      previousInputs = previousInputs.add(getInputKey(input));
    }

    for (const fromInfo of fromInfos) {
      const fromScript: Script = parseFromInfo(fromInfo, { config }).fromScript;
      const cellCollector = new LocktimeCellCollector(fromInfo, cellProvider, {
        config,
        tipHeader,
      });
      for await (const inputCell of cellCollector.collect()) {
        // skip inputs already exists in txSkeleton.inputs
        if (previousInputs.has(getInputKey(inputCell))) {
          continue;
        }

        let witness: HexString = "0x";
        if (isDaoScript(inputCell.cell_output.type, config)) {
          const template = config.SCRIPTS.DAO!;
          txSkeleton = addCellDep(txSkeleton, {
            dep_type: template.DEP_TYPE,
            out_point: {
              tx_hash: template.TX_HASH,
              index: template.INDEX,
            },
          });

          txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
            return headerDeps.push(
              inputCell.depositBlockHash!,
              inputCell.withdrawBlockHash!
            );
          });

          const depositHeaderDepIndex = txSkeleton.get("headerDeps").size - 2;
          const witnessArgs = {
            input_type: toBigUInt64LE(BigInt(depositHeaderDepIndex)),
          };
          witness = new Reader(
            core.SerializeWitnessArgs(
              normalizers.NormalizeWitnessArgs(witnessArgs)
            )
          ).serializeJson();
        }
        let multisigSince: bigint | undefined;
        if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
          // multisig
          const lockArgs = inputCell.cell_output.lock.args;
          multisigSince =
            lockArgs.length === 58
              ? _parseMultisigArgsSince(lockArgs)
              : undefined;
        }
        txSkeleton = await collectInput(
          txSkeleton,
          inputCell,
          Object.assign({}, fromInfo, { since: multisigSince }),
          { config, defaultWitness: witness, since: inputCell.since }
        );

        const inputCapacity = BigInt(inputCell.cell_output.capacity);
        let deductCapacity = inputCapacity;
        if (deductCapacity > amount) {
          deductCapacity = amount;
        }
        amount -= deductCapacity;
        changeCapacity += inputCapacity - deductCapacity;

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
            changeCapacity > minimalChangeCapacity)
        ) {
          break;
        }
      }
    }
  }

  return {
    txSkeleton,
    capacity: amount,
    changeCapacity: changeCapacity,
  };
}

export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: bigint,
  tipHeader: Header,
  {
    config = undefined,
    LocktimeCellCollector = CellCollector,
  }: {
    config?: Config;
    LocktimeCellCollector?: any;
  } = {}
): Promise<TransactionSkeletonType> {
  return transfer(txSkeleton, fromInfos, undefined, amount, tipHeader, {
    config,
    requireToAddress: false,
    LocktimeCellCollector,
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

export async function injectCapacity(
  txSkeleton: TransactionSkeletonType,
  outputIndex: number,
  fromInfos: FromInfo[],
  tipHeader: Header,
  {
    config = undefined,
    LocktimeCellCollector = CellCollector,
  }: Options & {
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
    LocktimeCellCollector?: any;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BigInt(
    txSkeleton.get("outputs").get(outputIndex)!.cell_output.capacity
  );
  return transfer(txSkeleton, fromInfos, undefined, capacity, tipHeader, {
    config,
    requireToAddress: false,
    LocktimeCellCollector,
  });
}

async function collectInput(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  fromInfo?: FromInfo,
  {
    config = undefined,
    since = undefined,
    defaultWitness = "0x",
  }: Options & { defaultWitness?: HexString; since?: PackedSince } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();

  txSkeleton = await setupInputCell(txSkeleton, inputCell, fromInfo, {
    config,
    since,
    defaultWitness,
  });

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.remove(outputs.size - 1);
  });

  return txSkeleton;
}

export async function setupInputCell(
  txSkeleton: TransactionSkeletonType,
  inputCell: Cell,
  fromInfo?: FromInfo,
  {
    config = undefined,
    since = undefined,
    defaultWitness = "0x",
  }: Options & { defaultWitness?: HexString; since?: PackedSince } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  const inputLock = inputCell.cell_output.lock;

  if (isSecp256k1Blake160Script(inputLock, config)) {
    return secp256k1Blake160.setupInputCell(txSkeleton, inputCell, fromInfo, {
      config,
      defaultWitness,
      since,
    });
  } else if (isSecp256k1Blake160MultisigScript(inputLock, config)) {
    return secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      inputCell,
      fromInfo,
      { config, defaultWitness, since }
    );
  } else {
    throw new Error(`Not supported input lock!`);
  }
}

function _parseMultisigArgsSince(args: HexString): bigint {
  if (args.length !== 58) {
    throw new Error("Invalid multisig with since args!");
  }
  return readBigUInt64LE("0x" + args.slice(42));
}

export default {
  CellCollector,
  transfer,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
  injectCapacityWithoutChange,
};
