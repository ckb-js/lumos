import {
  TransactionSkeletonType,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { Cell, CellDep, core } from "@ckb-lumos/base";
import { Reader, normalizers } from "@ckb-lumos/toolkit";

export interface txObject {
  inputs: Cell[];
  outputs: Cell[];
  cellDeps: CellDep[];
}

export function txSkeletonFromJson(
  tx: txObject,
  witnessHolder?: Reader | string
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
    const tmpWitness = new Reader(
      core.SerializeWitnessArgs(
        normalizers.NormalizeWitnessArgs(tmpWitnessArgs)
      )
    ).serializeJson();
    for (let i = 0; i < inputCell.length; i++) {
      skeleton = skeleton.update("witnesses", (witnesses) =>
        witnesses.push(tmpWitness)
      );
    }
  }

  return skeleton;
}
