import JSBI from "jsbi";
import test from "ava";
import { blockchain } from "@ckb-lumos/base";
import { toMolTypeMap } from "../src/utils";
import { CodecMap, MolType } from "../src/type";
import { createCodecMap } from "../src/codec";
import { BI } from "@ckb-lumos/bi";

test.before(() => {
  JSBI.prototype["valueOf"] = () => 0;
});

test("test simple codec", (t) => {
  const tokens: MolType[] = [
    { item: "byte", item_count: 1, name: "Uint8", type: "array" },
  ];
  const codecMap = createCodecMap(toMolTypeMap(tokens));
  t.truthy(codecMap["Uint8"].unpack("0x01") === 1);
  t.truthy(codecMap["Uint8"].unpack("0xff") === 255);
});

test("test codec with refs", (t) => {
  const tokens: MolType[] = [
    { item: "Bytes", name: "BytesVec", type: "vector" },
  ];
  const refs: CodecMap = { Bytes: blockchain.Bytes };
  const codecMap = createCodecMap(tokens, refs);
  t.deepEqual(codecMap["BytesVec"].unpack("0x0e00000008000000020000001234"), [
    "0x1234",
  ]);
});

// https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
const ast: MolType[] = [
  { type: "array", name: "Uint32", item: "byte", item_count: 4 },
  { type: "array", name: "Uint64", item: "byte", item_count: 8 },
  { type: "array", name: "Uint128", item: "byte", item_count: 16 },
  { type: "array", name: "Byte32", item: "byte", item_count: 32 },
  { type: "array", name: "Uint256", item: "byte", item_count: 32 },
  { type: "vector", name: "Bytes", item: "byte" },
  { type: "option", name: "BytesOpt", item: "Bytes" },
  { type: "vector", name: "BytesVec", item: "Bytes" },
  { type: "vector", name: "Byte32Vec", item: "Byte32" },
  { type: "option", name: "ScriptOpt", item: "Script" },
  { type: "array", name: "ProposalShortId", item: "byte", item_count: 10 },
  { type: "vector", name: "UncleBlockVec", item: "UncleBlock" },
  { type: "vector", name: "TransactionVec", item: "Transaction" },
  { type: "vector", name: "ProposalShortIdVec", item: "ProposalShortId" },
  { type: "vector", name: "CellDepVec", item: "CellDep" },
  { type: "vector", name: "CellInputVec", item: "CellInput" },
  { type: "vector", name: "CellOutputVec", item: "CellOutput" },
  {
    type: "table",
    name: "Script",
    fields: [
      { name: "codeHash", type: "Byte32" },
      { name: "hashType", type: "byte" },
      { name: "args", type: "Bytes" },
    ],
  },
  {
    type: "struct",
    name: "OutPoint",
    fields: [
      { name: "txHash", type: "Byte32" },
      { name: "index", type: "Uint32" },
    ],
  },
  {
    type: "struct",
    name: "CellInput",
    fields: [
      { name: "since", type: "Uint64" },
      { name: "previousOutput", type: "OutPoint" },
    ],
  },
  {
    type: "table",
    name: "CellOutput",
    fields: [
      { name: "capacity", type: "Uint64" },
      { name: "lock", type: "Script" },
      { name: "type", type: "ScriptOpt" },
    ],
  },
  {
    type: "struct",
    name: "CellDep",
    fields: [
      { name: "outPoint", type: "OutPoint" },
      { name: "depType", type: "byte" },
    ],
  },
  {
    type: "table",
    name: "RawTransaction",
    fields: [
      { name: "version", type: "Uint32" },
      { name: "cellDeps", type: "CellDepVec" },
      { name: "headerDeps", type: "Byte32Vec" },
      { name: "inputs", type: "CellInputVec" },
      { name: "outputs", type: "CellOutputVec" },
      { name: "outputsData", type: "BytesVec" },
    ],
  },
  {
    type: "table",
    name: "Transaction",
    fields: [
      { name: "raw", type: "RawTransaction" },
      { name: "witnesses", type: "BytesVec" },
    ],
  },
  {
    type: "struct",
    name: "RawHeader",
    fields: [
      { name: "version", type: "Uint32" },
      { name: "compactTarget", type: "Uint32" },
      { name: "timestamp", type: "Uint64" },
      { name: "number", type: "Uint64" },
      { name: "epoch", type: "Uint64" },
      { name: "parentHash", type: "Byte32" },
      { name: "transactionsRoot", type: "Byte32" },
      { name: "proposalsHash", type: "Byte32" },
      { name: "extraHash", type: "Byte32" },
      { name: "dao", type: "Byte32" },
    ],
  },
  {
    type: "struct",
    name: "Header",
    fields: [
      { name: "raw", type: "RawHeader" },
      { name: "nonce", type: "Uint128" },
    ],
  },
  {
    type: "table",
    name: "UncleBlock",
    fields: [
      { name: "header", type: "Header" },
      { name: "proposals", type: "ProposalShortIdVec" },
    ],
  },
  {
    type: "table",
    name: "Block",
    fields: [
      { name: "header", type: "Header" },
      { name: "uncles", type: "UncleBlockVec" },
      { name: "transactions", type: "TransactionVec" },
      { name: "proposals", type: "ProposalShortIdVec" },
    ],
  },
  {
    type: "table",
    name: "BlockV1",
    fields: [
      { name: "header", type: "Header" },
      { name: "uncles", type: "UncleBlockVec" },
      { name: "transactions", type: "TransactionVec" },
      { name: "proposals", type: "ProposalShortIdVec" },
      { name: "extension", type: "Bytes" },
    ],
  },
  {
    type: "table",
    name: "CellbaseWitness",
    fields: [
      { name: "lock", type: "Script" },
      { name: "message", type: "Bytes" },
    ],
  },
  {
    type: "table",
    name: "WitnessArgs",
    fields: [
      { name: "lock", type: "BytesOpt" },
      { name: "inputType", type: "BytesOpt" },
      { name: "outputType", type: "BytesOpt" },
    ],
  },
];
const codecMap = createCodecMap(toMolTypeMap(ast));
// below test cases come from:
// https://github.com/ckb-js/lumos/blob/e33aaa10d831edd58e904cb2215ea3148c37fba3/packages/base/tests/serialize.test.ts
test("should unpack Script", (t) => {
  t.deepEqual(
    codecMap["Script"].unpack(
      "0x3d0000001000000030000000310000009bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce80108000000aabbccdd44332211"
    ),
    {
      args: "0xaabbccdd44332211",
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "0x01",
    }
  );
});
test("should unpack OutPoint", (t) => {
  t.deepEqual(
    codecMap["OutPoint"].unpack(
      "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc03000000"
    ),
    {
      txHash:
        "0x4565f957aa65ca5d094ede05cbeaedcee70f5a71200ae2e31b643d2952c929bc",
      index: 3,
    }
  );
});
test("should unpack CellInput", (t) => {
  t.deepEqual(
    codecMap["CellInput"].unpack(
      "0x341200a060000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da10000000"
    ),
    {
      since: BI.from("0x60a0001234"),
      previousOutput: {
        txHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        index: 16,
      },
    }
  );
});

test("should unpack CellOutput", (t) => {
  t.deepEqual(
    codecMap["CellOutput"].unpack(
      "0x8400000010000000180000004f000000100000000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da0002000000123435000000100000003000000031000000a98c57135830e1b900000000f6c4b8870828199a786b26f09f7dec4bc27a73db0100000000"
    ),
    {
      capacity: BI.from("0x10"),
      lock: {
        codeHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        args: "0x1234",
        hashType: "0x00",
      },
      type: {
        codeHash:
          "0xa98c57135830e1b900000000f6c4b8870828199a786b26f09f7dec4bc27a73db",
        args: "0x",
        hashType: "0x01",
      },
    }
  );
});

test("should unpack CellOutput without type", (t) => {
  t.deepEqual(
    codecMap["CellOutput"].unpack(
      "0x4f00000010000000180000004f000000100000000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da00020000001234"
    ),
    {
      capacity: BI.from("0x10"),
      lock: {
        codeHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        args: "0x1234",
        hashType: "0x00",
      },
      type: undefined,
    }
  );
});

test("should unpack CellDep", (t) => {
  t.deepEqual(
    codecMap["CellDep"].unpack(
      "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da1100000000"
    ),
    {
      depType: "0x00",
      outPoint: {
        txHash:
          "0xa98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73da",
        index: 17,
      },
    }
  );
});
test("should unpack Transaction", (t) => {
  t.deepEqual(
    codecMap["Transaction"].unpack(
      "0x1f0100000c0000000f010000030100001c00000020000000490000006d0000009d000000f40000000000000001000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300000000000001000000b39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6010000001000000000000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73010200000057000000080000004f00000010000000180000004f000000341200000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302000200000012340f0000000800000003000000abcdef10000000080000000400000031313131"
    ),
    {
      raw: {
        version: 0,
        cellDeps: [
          {
            depType: "0x00",
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
              hashType: "0x00",
            },
            type: undefined,
          },
        ],
        outputsData: ["0xabcdef"],
      },
      witnesses: ["0x31313131"],
    }
  );
});

test("should unpack Header", (t) => {
  t.deepEqual(
    codecMap["Header"].unpack(
      "0x0000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b44"
    ),
    {
      nonce: BI.from("0x449b385049af131a0000001584a00100"),
      raw: {
        compactTarget: 439170196,
        number: BI.from("0xfb1bc"),
        parentHash:
          "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
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
      },
    }
  );
});

test("should unpack UncleBlock", (t) => {
  t.deepEqual(
    codecMap["UncleBlock"].unpack(
      "0xf40000000c000000dc0000000000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b440200000012345678901234567890abcdeabcdeabcdeabcde"
    ),
    {
      header: {
        nonce: BI.from("0x449b385049af131a0000001584a00100"),
        raw: {
          compactTarget: 439170196,
          number: BI.from("0xfb1bc"),
          parentHash:
            "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
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
        },
      },
      proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
    }
  );
});

test("should unpack Block", (t) => {
  t.deepEqual(
    codecMap["Block"].unpack(
      "0x2502000014000000e4000000e80000000d0200000000000094342d1ac363a6ab70010000bcb10f000000000087020012060807003134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b68a83c880eb942396d22020aa83343906986f66418e9b8a4488f2866ecc4e86a0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000040b4d9a3ddc9e730736c7342a2f023001240f362253b780000b6ca2f1e7901070001a084150000001a13af4950389b440400000025010000080000001d0100000c0000000f010000030100001c00000020000000490000006d0000009d000000f40000000000000001000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7300000000000001000000b39d53656421d1532dd995a0924441ca8f43052bc2b7740a0e814a488a8214d6010000001000000000000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a73010200000057000000080000004f00000010000000180000004f000000341200000000000037000000100000003000000031000000a98c57135830e1b91345948df6c4b8870828199a786b26f09f7dec4bc27a7302000200000012340f0000000800000003000000abcdef0e000000080000000200000011110200000012345678901234567890abcdeabcdeabcdeabcde"
    ),
    {
      header: {
        nonce: BI.from("0x449b385049af131a0000001584a00100"),
        raw: {
          compactTarget: 439170196,
          number: BI.from("0xfb1bc"),
          parentHash:
            "0x3134874027b9b2b17391d2fa545344b10bd8b8c49d9ea47d55a447d01142b21b",
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
        },
      },
      proposals: ["0x12345678901234567890", "0xabcdeabcdeabcdeabcde"],
      transactions: [
        {
          raw: {
            version: 0,
            cellDeps: [
              {
                depType: "0x00",
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
                  hashType: "0x00",
                },
                type: undefined,
              },
            ],
            outputsData: ["0xabcdef"],
          },
          witnesses: ["0x1111"],
        },
      ],
      uncles: [],
    }
  );
});

test("should unpack WitnessArgs", (t) => {
  t.deepEqual(
    codecMap["WitnessArgs"].unpack(
      "0x2200000010000000160000001c000000020000001234020000004678020000002312"
    ),
    {
      lock: "0x1234",
      inputType: "0x4678",
      outputType: "0x2312",
    }
  );
});

test("should unpack empty WitnessArgs", (t) => {
  t.deepEqual(
    codecMap["WitnessArgs"].unpack("0x10000000100000001000000010000000"),
    {
      lock: undefined,
      inputType: undefined,
      outputType: undefined,
    }
  );
});

test("should unpack only one WitnessArgs", (t) => {
  t.deepEqual(
    codecMap["WitnessArgs"].unpack(
      "0x16000000100000001600000016000000020000001234"
    ),
    {
      lock: "0x1234",
      inputType: undefined,
      outputType: undefined,
    }
  );
});
