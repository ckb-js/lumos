import {
  TransactionSkeletonType,
  TransactionSkeleton,
  Options,
} from "@ckb-lumos/helpers";
import {
  Cell,
  CellDep,
  blockchain,
  Script,
  CellProvider,
  QueryOptions,
  CellCollector as BaseCellCollectorType,
} from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";
import { CellCollectorType, FromInfo, parseFromInfo } from "../src";
import { Config, getConfig } from "@ckb-lumos/config-manager";

export interface txObject {
  inputs: Cell[];
  outputs: Cell[];
  cellDeps: CellDep[];
}

export function txSkeletonFromJson(
  tx: txObject,
  witnessHolder?: string
): TransactionSkeletonType {
  let skeleton = TransactionSkeleton({});
  const inputCell: Cell[] = tx.inputs;
  const outputCell: Cell[] = tx.outputs;
  const depCells: CellDep[] = tx.cellDeps;
  skeleton = skeleton.update("inputs", (inputs) => inputs.push(...inputCell));
  skeleton = skeleton.update("outputs", (outputs) =>
    outputs.push(...outputCell)
  );
  skeleton = skeleton.update("cellDeps", (cellDeps) =>
    cellDeps.push(...depCells)
  );

  if (witnessHolder !== undefined) {
    const tmpWitnessArgs = { lock: witnessHolder };
    const tmpWitness = bytes.hexify(
      blockchain.WitnessArgs.pack(tmpWitnessArgs)
    );
    for (let i = 0; i < inputCell.length; i++) {
      skeleton = skeleton.update("witnesses", (witnesses) =>
        witnesses.push(tmpWitness)
      );
    }
  }

  return skeleton;
}

export class TestCellCollector implements CellCollectorType {
  readonly fromScript: Script;
  private readonly config: Config;
  private cellCollector: BaseCellCollectorType;

  constructor(
    fromInfo: FromInfo,
    cellProvider: CellProvider,
    {
      config = undefined,
      queryOptions = {},
    }: Options & {
      queryOptions?: QueryOptions;
    } = {}
  ) {
    if (!cellProvider) {
      throw new Error(`Cell provider is missing!`);
    }
    config = config || getConfig();
    this.fromScript = parseFromInfo(fromInfo, { config }).fromScript;

    this.config = config;

    queryOptions = {
      ...queryOptions,
      lock: this.fromScript,
      type: queryOptions.type || "empty",
    };

    this.cellCollector = cellProvider.collector(queryOptions);
  }

  async *collect(): AsyncGenerator<Cell> {
    for await (const inputCell of this.cellCollector.collect()) {
      yield inputCell;
    }
  }
}
