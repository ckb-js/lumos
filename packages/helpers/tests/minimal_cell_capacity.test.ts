import test from "ava";
import { Cell, JSBI } from "@ckb-lumos/base";
import { minimalCellCapacity, minimalCellCapacityCompatible } from "../src";

const normalCell: Cell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
    },
    type: undefined,
  },
  data: "0x",
  block_hash: undefined,
  block_number: undefined,
  out_point: undefined,
};

const invalidCell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "typ",
    },
    type: undefined,
  },
  data: "0x",
  block_hash: undefined,
  block_number: undefined,
  out_point: undefined,
};

const cellWithTypeAndData: Cell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
    },
    type: {
      code_hash:
        "0x9e3b3557f11b2b3532ce352bfe8017e9fd11d154c4c7f9b7aaaa1e621b539a08",
      hash_type: "type",
      args: "0x",
    },
  },
  data: "0x1234",
  block_hash: undefined,
  block_number: undefined,
  out_point: undefined,
};

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("normal cell, validate true", (t) => {
  const capacity = minimalCellCapacityCompatible(normalCell);
  const expectedCapacity = JSBI.BigInt(
    JSBI.multiply(
      JSBI.BigInt(61),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(8))
    )
  ).toString();

  t.true(capacity.toString() === expectedCapacity.toString());
});

test("normal cell, validate failed", (t) => {
  t.throws(() => {
    minimalCellCapacity(invalidCell as any);
  });
});

test("cell with type and data, validate true", (t) => {
  const capacity = minimalCellCapacityCompatible(cellWithTypeAndData);
  const expectedCapacity = JSBI.BigInt(
    JSBI.multiply(
      JSBI.BigInt(61 + 33 + 2),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(8))
    )
  ).toString();

  t.true(capacity.toString() === expectedCapacity.toString());
});
