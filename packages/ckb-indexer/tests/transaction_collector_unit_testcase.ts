import { HashType, TransactionWithStatus } from "@ckb-lumos/base";
import { IndexerTransactionList } from "../src/type";
export const queryOption = {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as HashType,
    args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
  },
};
export const indexerTransactionListThatHaveZeroIoTypeInput: IndexerTransactionList = {
  lastCursor: "",
  objects: [
    {
      block_number: "0x44f48a",
      io_index: "0x0",
      io_type: "output",
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x1",
      io_type: "output",
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
  ],
};

export const indexerTransactionListThatHaveOneIoTypeInput: IndexerTransactionList = {
  lastCursor: "",
  objects: [
    {
      block_number: "0x44f48a",
      io_index: "0x0",
      io_type: "input",
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x1",
      io_type: "output",
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
  ],
};

export const indexerTransactionListThatHaveTwoIoTypeInput: IndexerTransactionList = {
  lastCursor: "",
  objects: [
    {
      block_number: "0x44f48a",
      io_index: "0x0",
      io_type: "input",
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x1",
      io_type: "input",
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
  ],
};
export const unresolvedTransaction: TransactionWithStatus = {
  transaction: {
    cell_deps: [
      {
        dep_type: "code",
        out_point: {
          index: "0x2",
          tx_hash:
            "0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f",
        },
      },
      {
        dep_type: "dep_group",
        out_point: {
          index: "0x0",
          tx_hash:
            "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
        },
      },
    ],
    hash: "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
    header_deps: [],
    inputs: [
      {
        previous_output: {
          index: "0x1",
          tx_hash:
            "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
        },
        since: "0x0",
      },
      {
        previous_output: {
          index: "0x1",
          tx_hash:
            "0x805168dafc0c10ae31de2580541db0f5ee8ff53afb55e39a5e2eeb60f878553f",
        },
        since: "0x0",
      },
      {
        previous_output: {
          index: "0x1",
          tx_hash:
            "0x6d22619e2866924f585b440543927bb4d21b8bdfac6e415fa156fc66f6a97af0",
        },
        since: "0x0",
      },
    ],
    outputs: [
      {
        capacity: "0xba43b7400",
        lock: {
          args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: {
          args: "0x",
          code_hash:
            "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
          hash_type: "type",
        },
      },
      {
        capacity: "0x5619c490e0",
        lock: {
          args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
    ],
    outputs_data: ["0x0000000000000000", "0x"],
    version: "0x0",
    witnesses: [
      "0x550000001000000055000000550000004100000009f8f9358524a53d9c0c6b9ecb745a86c0d0f359930bdd4334e64c5e438f2a163429f5a4e2ee12447d21bf9b506b0b449fccf6d8482cdc86350c36c252dde0a900",
      "0x",
      "0x",
    ],
  },
  tx_status: {
    block_hash:
      "0xbbb1f70add4698b3b9f2ee1d475a1c391c4337c135680169269ca61afacd00fc",
    status: "committed",
  },
};
export const unresolvedTransactionList: TransactionWithStatus[] = [
  unresolvedTransaction,
  unresolvedTransaction,
];

export const resolvedTransaction: TransactionWithStatus = {
  transaction: {
    cell_deps: [
      {
        dep_type: "code",
        out_point: {
          index: "0x2",
          tx_hash:
            "0x8f8c79eb6671709633fe6a46de93c0fedc9c1b8a6527a18d3983879542635c9f",
        },
      },
      {
        dep_type: "dep_group",
        out_point: {
          index: "0x0",
          tx_hash:
            "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
        },
      },
    ],
    hash: "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
    header_deps: [],
    inputs: [
      {
        previous_output: {
          index: "0x0",
          tx_hash:
            "0xdf1c8ca38b048e43b586fce520a5fff6aa3b0645f9279a6a7f42f9e872673b53",
        },
        since: "0x0",
      },
      {
        previous_output: {
          index: "0x0",
          tx_hash:
            "0x6ecef55d8e4e84996180e13561d4d40ab5ad6a08843d9ff27ebe8c3b72d6d6ca",
        },
        since: "0x0",
      },
    ],
    outputs: [
      {
        capacity: "0x37e11d600",
        lock: {
          args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
          code_hash:
            "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
          hash_type: "type",
        },
        type: {
          args: "0x",
          code_hash:
            "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
          hash_type: "type",
        },
      },
      {
        capacity: "0x1bf076460",
        lock: {
          args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        type: undefined,
      },
    ],
    outputs_data: ["0x0000000000000000", "0x"],
    version: "0x0",
    witnesses: [
      "0x5500000010000000550000005500000041000000faa130d034eb479304c17140223bd03f3aecef2d0e2f113addbbf15e96603c344c25a37aa68b1967984e60792181545e43505810c1ecc5a9da010492528736bf00",
      "0x",
    ],
  },
  tx_status: {
    block_hash:
      "0x4b3422f42a72c313c74d4b1c15a89fa16d466f8602dea9cd097cf0544177356d",
    status: "committed",
  },
};
