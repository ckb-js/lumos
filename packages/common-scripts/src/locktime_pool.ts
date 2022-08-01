import {
  parseAddress,
  Options,
  TransactionSkeletonType,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import { blockchain, bytes } from "@ckb-lumos/codec";
import { FromInfo, parseFromInfo } from "./from_info";
import secp256k1Blake160 from "./secp256k1_blake160";
import {
  calculateMaximumWithdrawCompatible,
  calculateDaoEarliestSinceCompatible,
} from "./dao";
import {
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
  SinceValidationInfo,
} from "@ckb-lumos/base";
const { toBigUInt64LE, readBigUInt64LECompatible, readBigUInt64LE } = utils;
const { ScriptValue } = values;
import {
  generateDaoScript,
  isSecp256k1Blake160MultisigScript,
  isSecp256k1Blake160Script,
  isDaoScript,
  prepareSigningEntries as _prepareSigningEntries,
  addCellDep,
} from "./helper";
const {
  parseEpoch,
  maximumAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  validateSince,
} = sinceUtils;
import { List, Set } from "immutable";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import { secp256k1Blake160Multisig } from ".";
import { parseSinceCompatible } from "@ckb-lumos/base/lib/since";
import { BI, BIish } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "./type";
import { RPC } from "@ckb-lumos/rpc";

export interface LocktimeCell extends Cell {
  since: PackedSince;
  depositBlockHash?: Hash;
  withdrawBlockHash?: Hash;
  sinceValidationInfo?: SinceValidationInfo;
}

export const CellCollector: CellCollectorConstructor = class CellCollector
  implements CellCollectorType
{
  private cellCollectors: List<CellCollectorType>;
  private config: Config;
  private rpc: RPC;
  private tipHeader?: Header;
  private tipSinceValidationInfo?: SinceValidationInfo;
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
      NodeRPC?: typeof RPC;
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

    if (tipHeader) {
      // TODO: `median_timestamp` is not provided now!
      this.tipSinceValidationInfo = {
        blockNumber: tipHeader.number,
        epoch: tipHeader.epoch,
        median_timestamp: "",
      };
    }

    this.rpc = new NodeRPC(cellProvider.uri!);

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
    };

    let cellCollectors = List<CellCollectorType>([]);
    if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
      const lock: Script = {
        codeHash: fromScript.codeHash,
        hashType: fromScript.hashType,
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
      if (
        !queryOptions.type &&
        (!queryOptions.data || queryOptions.data === "any")
      ) {
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
      if (
        !queryOptions.type &&
        (!queryOptions.data || queryOptions.data === "any")
      ) {
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
        const lock = inputCell.cellOutput.lock;

        let since: PackedSince | undefined;
        let maximumCapacity: BI | undefined;
        let depositBlockHash: Hash | undefined;
        let withdrawBlockHash: Hash | undefined;
        let sinceValidationInfo: SinceValidationInfo | undefined;

        // multisig
        if (lock.args.length === 58) {
          const header = (await this.rpc.getHeader(inputCell.blockHash!))!;
          since =
            "0x" + _parseMultisigArgsSinceCompatible(lock.args).toString(16);
          // TODO: `median_timestamp` not provided now!
          sinceValidationInfo = {
            epoch: header.epoch,
            blockNumber: header.number,
            median_timestamp: "",
          };
        }

        // dao
        if (isDaoScript(inputCell.cellOutput.type, this.config)) {
          if (inputCell.data === "0x0000000000000000") {
            continue;
          }
          const transactionWithStatus = (await this.rpc.getTransaction(
            inputCell.outPoint!.txHash
          ))!;
          withdrawBlockHash = transactionWithStatus.txStatus.blockHash;
          const transaction = transactionWithStatus.transaction;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const depositOutPoint =
            transaction.inputs[+inputCell.outPoint!.index].previousOutput;
          depositBlockHash = (await this.rpc.getTransaction(
            depositOutPoint!.txHash
          ))!.txStatus.blockHash!;
          const depositBlockHeader = await this.rpc.getHeader(depositBlockHash);
          const withdrawBlockHeader = await this.rpc.getHeader(
            withdrawBlockHash!
          );
          let daoSince: PackedSince =
            "0x" +
            calculateDaoEarliestSinceCompatible(
              depositBlockHeader!.epoch,
              withdrawBlockHeader!.epoch
            ).toString(16);
          maximumCapacity = calculateMaximumWithdrawCompatible(
            inputCell,
            depositBlockHeader!.dao,
            withdrawBlockHeader!.dao
          );
          const withdrawEpochValue = parseEpoch(withdrawBlockHeader!.epoch);
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
            const multisigSince = parseSinceCompatible(since);
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
          parseSinceCompatible(since!).type === "blockTimestamp" ||
          (this.tipHeader &&
            !validateSince(
              since!,
              this.tipSinceValidationInfo!,
              sinceValidationInfo
            ))
        ) {
          continue;
        }

        const result = {
          ...inputCell,
          since: since!,
          depositBlockHash: depositBlockHash,
          withdrawBlockHash: withdrawBlockHash,
          sinceValidationInfo,
        };
        result.cellOutput.capacity =
          "0x" +
          (maximumCapacity || BI.from(inputCell.cellOutput.capacity)).toString(
            16
          );

        yield result;
      }
    }
  }
};

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
    LocktimeCellCollector?: CellCollectorConstructor;
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
    LocktimeCellCollector?: CellCollectorConstructor;
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
    LocktimeCellCollector?: CellCollectorConstructor;
  } = {}
): Promise<TransactionSkeletonType | [TransactionSkeletonType, bigint]> {
  const result = await transferCompatible(
    txSkeleton,
    fromInfos,
    toAddress,
    amount,
    tipHeader,
    {
      config,
      requireToAddress,
      assertAmountEnough: assertAmountEnough as true | undefined,
      LocktimeCellCollector,
    }
  );
  let _txSkeleton: TransactionSkeletonType;
  let _amount: bigint;
  if (result instanceof Array) {
    _txSkeleton = result[0];
    _amount = BigInt(result[1].toString());
    return [_txSkeleton, _amount];
  } else {
    _txSkeleton = result;
    return _txSkeleton;
  }
}

export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: BIish,
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
    LocktimeCellCollector?: CellCollectorConstructor;
  }
): Promise<TransactionSkeletonType>;

export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: BIish,
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
    LocktimeCellCollector?: CellCollectorConstructor;
  }
): Promise<[TransactionSkeletonType, BI]>;
export async function transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  toAddress: Address | undefined,
  amount: BIish,
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
    LocktimeCellCollector?: CellCollectorConstructor;
  } = {}
): Promise<TransactionSkeletonType | [TransactionSkeletonType, BI]> {
  let _amount = BI.from(amount);
  for (const [index, fromInfo] of fromInfos.entries()) {
    const value = (await _transferCompatible(
      txSkeleton,
      fromInfo,
      index === 0 ? toAddress : undefined,
      _amount,
      tipHeader,
      {
        config,
        requireToAddress: index === 0 ? requireToAddress : false,
        assertAmountEnough: false,
        LocktimeCellCollector,
      }
    )) as [TransactionSkeletonType, BI];
    // [txSkeleton, amount] = value
    txSkeleton = value[0];
    _amount = value[1];

    if (_amount.eq(0)) {
      if (assertAmountEnough) {
        return txSkeleton;
      }
      return [txSkeleton, BI.from(_amount)];
    }
  }

  if (assertAmountEnough) {
    throw new Error("Not enough capacity in from addresses!");
  }
  return [txSkeleton, BI.from(_amount)];
}

async function _transferCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfo: FromInfo,
  toAddress: Address | undefined,
  amount: BIish,
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
    LocktimeCellCollector: CellCollectorConstructor;
    changeAddress?: Address;
  }
): Promise<TransactionSkeletonType | [TransactionSkeletonType, BI]> {
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

  let _amount = BI.from(amount || 0);
  if (toAddress) {
    const toScript = parseAddress(toAddress, { config });

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: "0x" + _amount.toString(16),
          lock: toScript,
          type: undefined,
        },
        data: "0x",
        outPoint: undefined,
        blockHash: undefined,
      });
    });
  }

  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && _amount.gt(0); ++i) {
    const output = txSkeleton.get("outputs").get(i)!;
    if (
      new ScriptValue(output.cellOutput.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const cellCapacity = BI.from(output.cellOutput.capacity);
      let deductCapacity;
      if (_amount.gte(cellCapacity)) {
        deductCapacity = cellCapacity;
      } else {
        deductCapacity = cellCapacity.sub(
          minimalCellCapacityCompatible(output)
        );
        if (deductCapacity.gt(_amount)) {
          deductCapacity = _amount;
        }
      }
      _amount = _amount.sub(deductCapacity);

      const clonedOutput = JSON.parse(JSON.stringify(output));
      clonedOutput.cellOutput.capacity =
        "0x" + cellCapacity.sub(deductCapacity).toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.update(i, () => clonedOutput);
      });
    }
  }
  // remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) => !BI.from(output.cellOutput.capacity).eq(0)
    );
  });
  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  if (_amount.gt(0)) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }

    const changeLockScript: Script = changeAddress
      ? parseAddress(changeAddress, { config })
      : fromScript;
    const changeCell: Cell = {
      cellOutput: {
        capacity: "0x0",
        lock: changeLockScript,
        type: undefined,
      },
      data: "0x",
      outPoint: undefined,
      blockHash: undefined,
    };
    let changeCapacity = BI.from(0);

    let previousInputs = Set<string>();
    for (const input of txSkeleton.get("inputs")) {
      previousInputs = previousInputs.add(
        `${input.outPoint!.txHash}_${input.outPoint!.index}`
      );
    }
    const cellCollector = new LocktimeCellCollector(fromInfo, cellProvider, {
      config,
      tipHeader,
    });
    for await (const cell of cellCollector.collect()) {
      const inputCell = cell as LocktimeCell;
      // skip inputs already exists in txSkeleton.inputs
      if (
        previousInputs.has(
          `${inputCell.outPoint!.txHash}_${inputCell.outPoint!.index}`
        )
      ) {
        continue;
      }

      let multisigSince: BI | undefined;
      if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
        const lockArgs = inputCell.cellOutput.lock.args;
        multisigSince =
          lockArgs.length === 58
            ? BI.from(_parseMultisigArgsSinceCompatible(lockArgs))
            : undefined;
      }
      let witness: HexString = "0x";
      if (isDaoScript(inputCell.cellOutput.type, config)) {
        const template = config.SCRIPTS.DAO!;
        txSkeleton = addCellDep(txSkeleton, {
          depType: template.DEP_TYPE,
          outPoint: {
            txHash: template.TX_HASH,
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
          inputType: toBigUInt64LE(depositHeaderDepIndex),
        };
        witness = bytes.hexify(blockchain.WitnessArgs.pack(witnessArgs));
      }

      txSkeleton = await collectInput(
        txSkeleton,
        inputCell,
        isSecp256k1Blake160MultisigScript(fromScript, config)
          ? Object.assign({}, fromInfo, { since: multisigSince })
          : fromInfo,
        { config, defaultWitness: witness, since: inputCell.since }
      );

      const inputCapacity = BI.from(inputCell.cellOutput.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity.gt(_amount)) {
        deductCapacity = _amount;
      }
      _amount = _amount.sub(deductCapacity);
      changeCapacity = changeCapacity.add(inputCapacity).sub(deductCapacity);
      if (isDaoScript(inputCell.cellOutput.type, config)) {
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
        _amount.eq(0) &&
        (changeCapacity.eq(0) ||
          changeCapacity.gt(minimalCellCapacityCompatible(changeCell)))
      ) {
        break;
      }
    }
    if (changeCapacity.gt(0)) {
      changeCell.cellOutput.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(changeCell)
      );
    }
  }

  if (!assertAmountEnough) {
    return [txSkeleton, _amount];
  }

  if (_amount.gt(0)) {
    throw new Error("Not enough capacity in from address!");
  }

  return txSkeleton;
}

async function injectCapacityWithoutChangeCompatible(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: BIish,
  tipHeader: Header,
  minimalChangeCapacity: BIish,
  {
    config = undefined,
    LocktimeCellCollector = CellCollector,
    enableDeductCapacity = true,
  }: {
    config?: Config;
    LocktimeCellCollector?: CellCollectorConstructor;
    enableDeductCapacity?: boolean;
  }
): Promise<{
  txSkeleton: TransactionSkeletonType;
  capacity: BI;
  changeCapacity: BI;
}> {
  config = config || getConfig();
  // fromScript can be secp256k1_blake160 / secp256k1_blake160_multisig

  let _amount = BI.from(amount);
  const _minimalChangeCapacity = BI.from(minimalChangeCapacity);
  if (enableDeductCapacity) {
    for (const fromInfo of fromInfos) {
      const fromScript: Script = parseFromInfo(fromInfo, { config }).fromScript;
      // validate fromScript
      if (
        !isSecp256k1Blake160MultisigScript(fromScript, config) &&
        !isSecp256k1Blake160Script(fromScript, config)
      ) {
        // Skip if not support.
        continue;
      }
      const lastFreezedOutput = txSkeleton
        .get("fixedEntries")
        .filter(({ field }) => field === "outputs")
        .maxBy(({ index }) => index);
      let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
      for (; i < txSkeleton.get("outputs").size && _amount.gt(0); ++i) {
        const output = txSkeleton.get("outputs").get(i)!;
        if (
          new ScriptValue(output.cellOutput.lock, { validate: false }).equals(
            new ScriptValue(fromScript, { validate: false })
          )
        ) {
          const clonedOutput: Cell = JSON.parse(JSON.stringify(output));
          const cellCapacity = BI.from(clonedOutput.cellOutput.capacity);
          let deductCapacity;
          if (_amount.gte(cellCapacity)) {
            deductCapacity = cellCapacity;
          } else {
            deductCapacity = cellCapacity.sub(
              minimalCellCapacityCompatible(clonedOutput)
            );
            if (deductCapacity.gt(_amount)) {
              deductCapacity = _amount;
            }
          }
          _amount = _amount.sub(deductCapacity);
          clonedOutput.cellOutput.capacity =
            "0x" + cellCapacity.sub(deductCapacity).toString(16);

          txSkeleton = txSkeleton.update("outputs", (outputs) => {
            return outputs.update(i, () => clonedOutput);
          });
        }
      }
      // remove all output cells with capacity equal to 0
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.filter(
          (output) => !BI.from(output.cellOutput.capacity).eq(0)
        );
      });
    }
  }

  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  let changeCapacity = BI.from(0);
  if (_amount.gt(0)) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }

    const getInputKey = (input: Cell) =>
      `${input.outPoint!.txHash}_${input.outPoint!.index}`;
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
      for await (const cell of cellCollector.collect()) {
        const inputCell = cell as LocktimeCell;
        // skip inputs already exists in txSkeleton.inputs
        if (previousInputs.has(getInputKey(inputCell))) {
          continue;
        }

        let witness: HexString = "0x";
        if (isDaoScript(inputCell.cellOutput.type, config)) {
          const template = config.SCRIPTS.DAO!;
          txSkeleton = addCellDep(txSkeleton, {
            depType: template.DEP_TYPE,
            outPoint: {
              txHash: template.TX_HASH,
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
            inputType: toBigUInt64LE(BI.from(depositHeaderDepIndex).toString()),
          };
          witness = bytes.hexify(blockchain.WitnessArgs.pack(witnessArgs));
        }
        let multisigSince: BI | undefined;
        if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
          // multisig
          const lockArgs = inputCell.cellOutput.lock.args;
          multisigSince =
            lockArgs.length === 58
              ? BI.from(_parseMultisigArgsSinceCompatible(lockArgs))
              : undefined;
        }
        txSkeleton = await collectInput(
          txSkeleton,
          inputCell,
          Object.assign({}, fromInfo, { since: multisigSince }),
          {
            config,
            defaultWitness: witness,
            since: inputCell.since,
          }
        );

        const inputCapacity = BI.from(inputCell.cellOutput.capacity);
        let deductCapacity = inputCapacity;
        if (deductCapacity.gt(_amount)) {
          deductCapacity = _amount;
        }
        _amount = _amount.sub(deductCapacity);
        changeCapacity = changeCapacity.add(inputCapacity).sub(deductCapacity);

        if (isDaoScript(inputCell.cellOutput.type, config)) {
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
          _amount.eq(0) &&
          (changeCapacity.eq(0) || changeCapacity.gt(_minimalChangeCapacity))
        ) {
          break;
        }
      }
    }
  }

  return {
    txSkeleton,
    capacity: BI.from(_amount.toString()),
    changeCapacity: BI.from(changeCapacity.toString()),
  };
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
    enableDeductCapacity = true,
  }: {
    config?: Config;
    LocktimeCellCollector?: CellCollectorConstructor;
    enableDeductCapacity?: boolean;
  }
): Promise<{
  txSkeleton: TransactionSkeletonType;
  capacity: bigint;
  changeCapacity: bigint;
}> {
  const result = await injectCapacityWithoutChangeCompatible(
    txSkeleton,
    fromInfos,
    amount,
    tipHeader,
    minimalChangeCapacity,
    {
      config,
      LocktimeCellCollector,
      enableDeductCapacity,
    }
  );

  return {
    txSkeleton: result.txSkeleton,
    capacity: result.capacity.toBigInt(),
    changeCapacity: result.changeCapacity.toBigInt(),
  };
}

export async function payFee(
  txSkeleton: TransactionSkeletonType,
  fromInfos: FromInfo[],
  amount: BIish,
  tipHeader: Header,
  {
    config = undefined,
    LocktimeCellCollector = CellCollector,
  }: {
    config?: Config;
    LocktimeCellCollector?: CellCollectorConstructor;
  } = {}
): Promise<TransactionSkeletonType> {
  return transferCompatible(
    txSkeleton,
    fromInfos,
    undefined,
    amount,
    tipHeader,
    {
      config,
      requireToAddress: false,
      LocktimeCellCollector,
    }
  );
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
    // eslint-disable-next-line
    cellCollector?: (...params: any[]) => AsyncIterable<LocktimeCell>;
    LocktimeCellCollector?: CellCollectorConstructor;
  } = {}
): Promise<TransactionSkeletonType> {
  config = config || getConfig();
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BI.from(
    txSkeleton.get("outputs").get(outputIndex)!.cellOutput.capacity
  );
  return transferCompatible(
    txSkeleton,
    fromInfos,
    undefined,
    BI.from(capacity),
    tipHeader,
    {
      config,
      requireToAddress: false,
      LocktimeCellCollector,
    }
  );
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
  const inputLock = inputCell.cellOutput.lock;

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
      {
        config,
        defaultWitness,
        since,
      }
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

function _parseMultisigArgsSinceCompatible(args: HexString): BI {
  if (args.length !== 58) {
    throw new Error("Invalid multisig with since args!");
  }
  return readBigUInt64LECompatible("0x" + args.slice(42));
}

export default {
  CellCollector,
  transfer,
  transferCompatible,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
  injectCapacityWithoutChange,
  injectCapacityWithoutChangeCompatible,
};
