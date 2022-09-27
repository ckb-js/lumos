import JSBI from "jsbi";
import { HashType } from "@ckb-lumos/base";
import { DepType } from "./../src/api.d";
import test from "ava";
import * as blockchain from "../src/blockchain";
import type * as api from "../src/api";
import { BI } from "@ckb-lumos/bi";

test.before(() => {
  // override valueOf of jsbi to make it comparable under ava test evironment
  JSBI.prototype["valueOf"] = function () {
    return this.toString();
  };
});

test("unpack script", (t) => {
  const value: api.Script = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    args: "0xaabbccdd44332211",
    hashType: "type" as HashType,
  };
  const data =
    "0x3d0000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80108000000aabbccdd44332211";
  const unpacked = blockchain.Script.unpack(data);
  t.deepEqual(value, unpacked);
});

test("unpack outpoint", (t) => {
  const value = {
    txHash:
      "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc",
    index: BI.from("0x03").toNumber(),
  };
  const data =
    "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc03000000";
  const unpacked = blockchain.OutPoint.unpack(data);
  t.deepEqual(unpacked, value);
});

test("unpack cellinput", (t) => {
  const value = {
    since: BI.from("0x60a0001234"),
    previousOutput: {
      txHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: 16,
    },
  };
  const data =
    "0x341200a060000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da10000000";
  const unpacked = blockchain.CellInput.unpack(data);
  t.deepEqual(unpacked, value);
});

test("unpack celloutput", (t) => {
  const value = {
    capacity: BI.from("0x10"),
    lock: {
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hashType: "data" as HashType,
    },
    type: {
      codeHash:
        "0xa98c57135830e1b900000000f6c4b8870828199a786b26f09f7dec4bc27a73db",
      args: "0x",
      hashType: "type" as HashType,
    },
  };
  const data =
    "0x8400000010000000180000004f000000100000000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da0002000000123435000000100000003000000031000000a98c57135830e1b900000000f6c4b8870828199a786b26f09f7dec4bc27a73db0100000000";
  const unpacked = blockchain.CellOutput.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack celloutput without type", (t) => {
  const value = {
    capacity: BI.from("0x10"),
    lock: {
      codeHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      args: "0x1234",
      hashType: "data" as HashType,
    },
    type: undefined,
  };
  const data =
    "0x4f00000010000000180000004f000000100000000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da00020000001234";
  const unpacked = blockchain.CellOutput.unpack(data);
  t.deepEqual(unpacked, value);
});

test("unpack celldep", (t) => {
  const value = {
    depType: "code",
    outPoint: {
      txHash:
        "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
      index: 17,
    },
  };
  const data =
    "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da1100000000";
  const unpacked = blockchain.CellDep.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack transaction", (t) => {
  const value = {
    version: 0,
    cellDeps: [
      {
        depType: "code" as DepType,
        outPoint: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
          index: 0,
        },
      },
    ],
    headerDeps: [
      "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
    ],
    inputs: [
      {
        since: BI.from("0x10"),
        previousOutput: {
          txHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
          index: 2,
        },
      },
    ],
    outputs: [
      {
        capacity: BI.from("0x1234"),
        lock: {
          codeHash:
            "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
          args: "0x1234",
          hashType: "data" as HashType,
        },
        type: undefined,
      },
    ],
    outputsData: ["0xabcdef"],
    witnesses: ["0x31313131"],
  };
  const data =
    "0x1f0100000c0000000f010000030100001c00000020000000490000006d0000009d000000f40000000000000001000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300000000000001000000b39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6010000001000000000000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73010200000057000000080000004f00000010000000180000004f000000341200000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302000200000012340f0000000800000003000000abcdef10000000080000000400000031313131";
  const unpacked = blockchain.Transaction.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack header", (t) => {
  const value = {
    compactTarget: 439170196,
    number: BI.from("0xfb1bc"),
    parentHash:
      "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
    nonce: BI.from("0x449b385049af131a0000001584a00100"),
    timestamp: BI.from("0x170aba663c3"),
    transactionsRoot:
      "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
    proposalsHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    extraHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: 0,
    epoch: BI.from("0x7080612000287"),
    dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
    hash: "",
  };
  const data =
    "0x0000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b44";
  const unpacked = blockchain.Header.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack uncle block", (t) => {
  const value = {
    header: {
      compactTarget: 439170196,
      number: BI.from("0xfb1bc"),
      parentHash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: BI.from("0x449b385049af131a0000001584a00100"),
      timestamp: BI.from("0x170aba663c3"),
      transactionsRoot:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposalsHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      extraHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: 0,
      epoch: BI.from("0x7080612000287"),
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
      hash: "",
    },
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  };
  const data =
    "0xf40000000c000000dc0000000000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b440200000012345678901234567890abcdeabcdeabcdeabcde";
  const unpacked = blockchain.UncleBlock.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack block", (t) => {
  const value = {
    header: {
      compactTarget: 439170196,
      number: BI.from("0xfb1bc"),
      parentHash:
        "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
      nonce: BI.from("0x449b385049af131a0000001584a00100"),
      timestamp: BI.from("0x170aba663c3"),
      transactionsRoot:
        "0x68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a",
      proposalsHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      extraHash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: 0,
      epoch: BI.from("0x7080612000287"),
      dao: "0x40b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e790107",
      hash: "",
    },
    transactions: [
      {
        version: 0,
        cellDeps: [
          {
            depType: "code" as DepType,
            outPoint: {
              txHash:
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300",
              index: 0,
            },
          },
        ],
        headerDeps: [
          "0xb39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6",
        ],
        inputs: [
          {
            since: BI.from("0x10"),
            previousOutput: {
              txHash:
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7301",
              index: 2,
            },
          },
        ],
        outputs: [
          {
            capacity: BI.from("0x1234"),
            lock: {
              codeHash:
                "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302",
              args: "0x1234",
              hashType: "data" as HashType,
            },
            type: undefined,
          },
        ],
        outputsData: ["0xabcdef"],
        witnesses: ["0x1111"],
      },
    ],
    uncles: [],
    proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
  };
  const data =
    "0x2502000014000000e4000000e80000000d0200000000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b440400000025010000080000001d0100000c0000000f010000030100001c00000020000000490000006d0000009d000000f40000000000000001000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300000000000001000000b39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6010000001000000000000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73010200000057000000080000004f00000010000000180000004f000000341200000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302000200000012340f0000000800000003000000abcdef0e000000080000000200000011110200000012345678901234567890abcdeabcdeabcdeabcde";
  const unpacked = blockchain.Block.unpack(data);

  t.deepEqual(unpacked, value);
});

test("serialize witness args", (t) => {
  const value = {
    lock: "0x1234",
    inputType: "0x4678",
    outputType: "0x2312",
  };
  const data =
    "0x2200000010000000160000001c000000020000001234020000004678020000002312";
  const unpacked = blockchain.WitnessArgs.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack empty witness args", (t) => {
  const value = {
    lock: undefined,
    inputType: undefined,
    outputType: undefined,
  };
  const data = "0x10000000100000001000000010000000";
  const unpacked = blockchain.WitnessArgs.unpack(data);

  t.deepEqual(unpacked, value);
});

test("unpack only one witness args", (t) => {
  const value = {
    lock: "0x1234",
    inputType: undefined,
    outputType: undefined,
  };
  const data = "0x16000000100000001600000016000000020000001234";
  const unpacked = blockchain.WitnessArgs.unpack(data);

  t.deepEqual(unpacked, value);
});
