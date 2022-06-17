import { DataLoader, DebuggerData, ExecuteResult } from "./types";
import {
  createTransactionFromSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { CellDep, HexString } from "@ckb-lumos/base";
import { bytify } from "@ckb-lumos/codec/lib/bytes";
import { OutPointVec } from "./codecs";

export function parseDebuggerMessage(message: string): ExecuteResult {
  const codeMatch = message.match(/Run result: (\d+)/);
  const cycleMatch = message.match(/Total cycles consumed: (\d+)/);

  if (!codeMatch || !cycleMatch) throw new Error("Invalid debugger result");

  const code = Number(codeMatch[1]);
  const cycles = Number(cycleMatch[1]);

  return { code, cycles, message };
}

type ResolvedCellDep = { cell_dep: CellDep; data: HexString };

/**
 * resolve a {@link CellDep cellDep} to code data
 * @param cellDep
 * @param loader
 */
function resolveCellDeps(
  cellDep: CellDep,
  loader: DataLoader
): ResolvedCellDep[] {
  const cellData = loader.getCellData(cellDep.out_point);

  if (cellDep.dep_type === "dep_group") {
    const outPoints = OutPointVec.unpack(bytify(cellData));

    return [{ data: cellData, cell_dep: cellDep }].concat(
      outPoints.map((outPoint) => {
        return {
          cell_dep: { dep_type: "code", out_point: outPoint },
          data: loader.getCellData(outPoint),
        };
      })
    );
  }

  if (cellDep.dep_type === "code") {
    return [{ cell_dep: cellDep, data: cellData }];
  }

  throw new Error(`Invalid dep type ${cellDep.dep_type}`);
}

export function parseDebuggerData(
  txSkeleton: TransactionSkeletonType,
  loader: DataLoader
): DebuggerData {
  const tx = createTransactionFromSkeleton(txSkeleton);

  return {
    mock_info: {
      inputs: txSkeleton.inputs.toArray().map((cell, i) => ({
        input: tx.inputs[i],
        output: cell.cell_output,
        data: cell.data,
      })),
      cell_deps: txSkeleton
        .get("cellDeps")
        .toArray()
        .flatMap((cellDep) =>
          resolveCellDeps(cellDep, loader).map((resolvedCellDep) => ({
            ...resolvedCellDep,
            // mock a cell to place the code dep
            output: {
              capacity: "0x0",
              lock: {
                code_hash: "0x" + "00".repeat(32),
                args: "0x",
                hash_type: "data",
              },
            },
          }))
        ),
      header_deps: txSkeleton.get("headerDeps").toArray().map(loader.getHeader),
    },
    tx,
  };
}
