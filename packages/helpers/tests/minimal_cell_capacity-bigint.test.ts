import test from "ava";
import { Cell } from "@ckb-lumos/base";
import { minimalCellCapacity, minimalScriptCapacity } from "../src";

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

test("BigInt:normal cell, validate true", (t) => {
  const capacity = minimalCellCapacity(normalCell);
  const expectedCapacity = BigInt(61 * 10 ** 8);

  t.true(capacity === expectedCapacity);
});

test("BigInt:cell with type and data, validate true", (t) => {
  const capacity = minimalCellCapacity(cellWithTypeAndData);
  const expectedCapacity = BigInt((61 + 33 + 2) * 10 ** 8);

  t.true(capacity === expectedCapacity);
});

test("BigInt:no args script capacity", (t) => {
  const capacity = minimalScriptCapacity({
    args: "0x",
    codeHash:
      "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
    hashType: "type",
  });
  const expectedCapacity = BigInt(33 * 10 ** 8);
  t.true(capacity === expectedCapacity);
});

test("BigInt:normal script, validate true", (t) => {
  const capacity = minimalScriptCapacity({
    args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type",
  });
  const expectedCapacity = BigInt(53 * 10 ** 8);
  t.true(capacity === expectedCapacity);
});
