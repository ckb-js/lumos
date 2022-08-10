import test from "ava";
import { Cell } from "@ckb-lumos/base";
import {
  minimalCellCapacity,
  minimalCellCapacityCompatible,
  minimalScriptCapacity,
  minimalScriptCapacityCompatible,
} from "../src";
import { BI } from "@ckb-lumos/bi";

const normalCell: Cell = {
  cellOutput: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
    },
    type: undefined,
  },
  data: "0x",
  blockHash: undefined,
  blockNumber: undefined,
  outPoint: undefined,
};

const invalidCell = {
  cellOutput: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "typ",
    },
    type: undefined,
  },
  data: "0x",
  blockHash: undefined,
  blockNumber: undefined,
  outPoint: undefined,
};

const cellWithTypeAndData: Cell = {
  cellOutput: {
    capacity: "0x174876e800",
    lock: {
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
    },
    type: {
      codeHash:
        "0x9e3b3557f11b2b3532ce352bfe8017e9fd11d154c4c7f9b7aaaa1e621b539a08",
      hashType: "type",
      args: "0x",
    },
  },
  data: "0x1234",
  blockHash: undefined,
  blockNumber: undefined,
  outPoint: undefined,
};

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("normal cell, validate true", (t) => {
  const capacity = minimalCellCapacityCompatible(normalCell);
  const expectedCapacity = BI.from(61).mul(BI.from(10).pow(8));
  t.true(capacity.toString() === expectedCapacity.toString());
});

test("normal cell, validate failed", (t) => {
  t.throws(() => {
    minimalCellCapacity(invalidCell as any);
  });
});

test("cell with type and data, validate true", (t) => {
  const capacity = minimalCellCapacityCompatible(cellWithTypeAndData);
  const expectedCapacity = BI.from(61 + 33 + 2).mul(BI.from(10).pow(8));
  t.true(capacity.toString() === expectedCapacity.toString());
});

test("no args script capacity", (t) => {
  const capacity = minimalScriptCapacityCompatible({
    args: "0x",
    codeHash:
      "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
    hashType: "type",
  });
  const expectedCapacity = BI.from(33).mul(BI.from(10).pow(8));
  t.true(capacity.toString() === expectedCapacity.toString());
});

test("normal script, validate true", (t) => {
  const capacity = minimalScriptCapacityCompatible({
    args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
  });
  const expectedCapacity = BI.from(53).mul(BI.from(10).pow(8));
  t.true(capacity.toString() === expectedCapacity.toString());
});

test("invalid script, validate failed", (t) => {
  t.throws(() => {
    minimalScriptCapacity({
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "invalid",
    } as any);
  });
});
