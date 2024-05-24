import { createModelHelper, ModelHelper } from "./base";
import { blockchain, Cell } from "@ckb-lumos/base";
import { scriptHelper, ScriptLike } from "./script";
import { BI, BIish } from "@ckb-lumos/bi";
import { bytes, BytesLike, PackParam } from "@ckb-lumos/codec";
import { option, table } from "@ckb-lumos/codec/lib/molecule";
import { outPointHelper } from "./blockchain";
import { minimalCellCapacityCompatible } from "../index";

type CreateCellOptions = {
  capacity?: BIish;
  lock: ScriptLike;
  type?: PackParam<typeof blockchain.Script>;
  outPoint?: PackParam<typeof blockchain.OutPoint>;
  data?: BytesLike;
};

type CellLike = Cell | CreateCellOptions;

function isCreateCellOptions(val: unknown): val is CreateCellOptions {
  if (!val || typeof val !== "object") return false;
  return "lock" in val;
}

const CellCodec = table(
  {
    cellOutput: blockchain.CellOutput,
    data: blockchain.Bytes,
    outPoint: option(blockchain.OutPoint),
  },
  ["cellOutput", "data", "outPoint"]
);

/**
 * A set of helper functions for Cell
 * @example
 * const cell = CellHelper.create({ lock: 'ckb1secp256k1lock' })
 * cell.cellOutput.capacity // == 61 CKB
 */
export const cellHelper: ModelHelper<Cell, CellLike> = createModelHelper({
  pack: (model) => {
    const cell: Cell = (() => {
      if (isCreateCellOptions(model)) {
        return {
          cellOutput: {
            capacity: BI.from(model.capacity || "0x0").toHexString(),
            lock: scriptHelper.create(model.lock),
            type: model.type && scriptHelper.create(model.type),
          },

          outPoint: model.outPoint && outPointHelper.create(model.outPoint),
          data: bytes.hexify(model.data || "0x"),
        };
      }

      return model;
    })();

    if (BI.from(cell.cellOutput.capacity).eq(0)) {
      cell.cellOutput.capacity =
        minimalCellCapacityCompatible(cell).toHexString();
    }

    return CellCodec.pack(cell);
  },
  unpack: (value) => CellCodec.unpack(value),
});
