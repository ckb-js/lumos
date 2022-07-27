import { DataLoader, DebuggerData, ExecuteResult } from "./types";
import { createTransactionFromSkeleton, TransactionSkeletonType } from "@ckb-lumos/helpers";
import { CellDep, HexString } from "@ckb-lumos/base";
import { bytify } from "@ckb-lumos/codec/lib/bytes";
import { OutPointVec } from "./codecs";
import { ParamsFormatter } from "@ckb-lumos/rpc";
import { RPC } from "@ckb-lumos/rpc/lib/types/rpc";

export function parseDebuggerMessage(message: string, debugMessage = ""): ExecuteResult {
  const codeMatch = message.match(/Run result: (-?\d+)/);
  const cycleMatch = message.match(/Total cycles consumed: (\d+)/);

  if (!codeMatch || !cycleMatch) {
    throw new Error("Invalid debugger result: " + message + (debugMessage ? debugMessage : ""));
  }

  const code = Number(codeMatch[1]);
  const cycles = Number(cycleMatch[1]);

  return { code, cycles, message, debugMessage };
}

type ResolvedCellDep = { cell_dep: RPC.CellDep; data: HexString };

/**
 * resolve a {@link CellDep cellDep} to code data
 * @param cellDep
 * @param loader
 */
function resolveCellDeps(cellDep: CellDep, loader: DataLoader): ResolvedCellDep[] {
  const cellData = loader.getCellData(cellDep.outPoint);

  if (cellDep.depType === "depGroup") {
    const outPoints = OutPointVec.unpack(bytify(cellData));

    return [{ data: cellData, cell_dep: ParamsFormatter.toCellDep(cellDep) }].concat(
      outPoints.map((outPoint) => {
        return {
          cell_dep: {
            dep_type: "code",
            out_point: ParamsFormatter.toOutPoint(outPoint),
          },
          data: loader.getCellData(outPoint),
        };
      })
    );
  }

  if (cellDep.depType === "code") {
    return [{ cell_dep: ParamsFormatter.toCellDep(cellDep), data: cellData }];
  }

  throw new Error(`Invalid dep type ${cellDep.depType}`);
}

export function parseDebuggerData(txSkeleton: TransactionSkeletonType, loader: DataLoader): DebuggerData {
  const tx = createTransactionFromSkeleton(txSkeleton);
  return {
    mock_info: {
      inputs: txSkeleton.inputs.toArray().map((cell, i) => ({
        input: ParamsFormatter.toInput(tx.inputs[i]),
        output: ParamsFormatter.toOutput(cell.cellOutput),
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
      //TODO unimplemented
      header_deps: [],
    },
    tx: {
      version: tx.version,
      cell_deps: tx.cellDeps.map(ParamsFormatter.toCellDep),
      // TODO unimplemented
      header_deps: [],
      inputs: tx.inputs.map(ParamsFormatter.toInput),
      outputs: tx.outputs.map(ParamsFormatter.toOutput),
      witnesses: tx.witnesses,
      outputs_data: tx.outputsData,
    },
  };
}
