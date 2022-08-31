import {
  TransactionSkeletonType,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { Cell, CellDep, blockchain } from "@ckb-lumos/base";
import { bytes } from "@ckb-lumos/codec";

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
