import { HashType } from "@ckb-lumos/base";
import { IOType } from "../src/type";

export const queryOption = {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as HashType,
    args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
  },
};

export const ioTypeInputResult = Promise.resolve([
  {
    jsonrpc: "2.0",
    result: {
      transaction: {
        cell_deps: [
          {
            dep_type: "dep_group",
            out_point: {
              index: "0x0",
              tx_hash:
                "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            },
          },
        ],
        hash:
          "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
        header_deps: [],
        inputs: [
          {
            previous_output: {
              index: "0x0",
              tx_hash:
                "0xe39bd05f4814c9148d60273e252c6ac7cbad750adf7e74a1d8b37ed709d04be4",
            },
            since: "0x0",
          },
        ],
        outputs: [
          {
            capacity: "1111111",
            lock: {
              args: "0x81a870a08f4721c5fa495de9c29e3076440af55f",
              code_hash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
          {
            capacity: "0x189640200",
            lock: {
              args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
              code_hash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
        ],
        outputs_data: ["0x", "0x"],
        version: "0x0",
        witnesses: [
          "0x5500000010000000550000005500000041000000ea523d1845e793f67f3048c0df950de85b02f8934eeabdbe0a8b6073f5065d9558c1f997f1a20215193393e3b46575b91dd9b042d36811fc0a7ac0c5eedf026a00",
        ],
      },
      tx_status: {
        block_hash:
          "0x344ea1f8ff1105a033f27e728bd92cf8a3666c3dbe5a84151c7200cad88bdd79",
        reason: null,
        status: "committed",
      },
    },
    id: 0,
  },
]);
export const batchRequestIoTypeInput = [
  {
    id: 0,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
    ],
  },
];
export const getTransactionFromIndexerResult = Promise.resolve({
  lastCursor:
    "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
  objects: [
    {
      block_number: "0x21420d",
      io_index: "0x0",
      io_type: "input" as IOType,
      tx_hash:
        "0xc8a7917a9b269ca746f49177e75d4f5e7eb7ad20f79f44b079b5caecd4ffe96f",
      tx_index: "0x1",
    },
  ],
});
export const batchRequestAllIoType = [
  {
    id: 0,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0xc8a7917a9b269ca746f49177e75d4f5e7eb7ad20f79f44b079b5caecd4ffe96f",
    ],
  },
];
export const batchRequestResult = Promise.resolve([
  {
    jsonrpc: "2.0",
    result: {
      transaction: {
        cell_deps: [
          {
            dep_type: "dep_group",
            out_point: {
              index: "0x0",
              tx_hash:
                "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            },
          },
        ],
        hash:
          "0xc8a7917a9b269ca746f49177e75d4f5e7eb7ad20f79f44b079b5caecd4ffe96f",
        header_deps: [],
        inputs: [
          {
            previous_output: {
              index: "0x1",
              tx_hash:
                "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
            },
            since: "0x0",
          },
          {
            previous_output: {
              index: "0x0",
              tx_hash:
                "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
            },
            since: "0x0",
          },
        ],
        outputs: [
          {
            capacity: "0x746a528800",
            lock: {
              args: "0xf4f9a05e39ac30f79a1a6fede73528be23002bba",
              code_hash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
          {
            capacity: "0x7269990f76f",
            lock: {
              args: "0xcde34141e599aa7473cb0f56fa7f97b92503f275",
              code_hash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
        ],
        outputs_data: ["0x", "0x"],
        version: "0x0",
        witnesses: [
          "0x5500000010000000550000005500000041000000a100bd5e8eb121e07dc73680377830be7f8f28f9a22136b65ca113a3750e6c4d0e5a6bba9da2d1add0c252d103a3957705dcffc25d18a1be2e80dc0de412588601",
          "0x5500000010000000550000005500000041000000107e1c7ebec06c3ce900256efded7ccaa26b74ddb8b3dd180ae8727d52ae38f1449eca346fcd8b474ea9060dea40c1ab1ce4c0930567ddd511e17d0466a0f4a500",
        ],
      },
      tx_status: {
        block_hash:
          "0x2d564e5524762bdb0a4ab8120dd7fa4d3f2720406e82a2dfe2d239fe0f2d579e",
        reason: null,
        status: "committed",
      },
    },
    id: 0,
  },
]);
const nodeUri = "http://127.0.0.1:8118/rpc";

const batchRequestArgs = [nodeUri, batchRequestAllIoType];
export const batchRequest = {
  args: batchRequestArgs,
  result: batchRequestResult,
};

export const multipleInputCellTx = Promise.resolve({
  lastCursor:
    "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801dfc8ad219178a307ff117ee4e2fe760cd18410a7000000000045edea000000010000000101",
  objects: [
    {
      block_number: "0x44f48a",
      io_index: "0x0",
      io_type: "input" as IOType,
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x0",
      io_type: "output" as IOType,
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x1",
      io_type: "input" as IOType,
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x1",
      io_type: "output" as IOType,
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
    {
      block_number: "0x44f48a",
      io_index: "0x2",
      io_type: "input" as IOType,
      tx_hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
      tx_index: "0x1",
    },
  ],
});
const transaction0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6Result = {
  jsonrpc: "2.0",
  result: {
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
      hash:
        "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
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
          type: null,
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
      reason: null,
      status: "committed",
    },
  },
  id: 0,
};
export const multipleInputCellBatchRequestResult = Promise.resolve([
  {
    ...transaction0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6Result,
    id: 0,
  },
  {
    ...transaction0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6Result,
    id: 1,
  },
  {
    ...transaction0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6Result,
    id: 2,
  },
  {
    ...transaction0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6Result,
    id: 3,
  },
  {
    ...transaction0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6Result,
    id: 4,
  },
]);

export const batchForAll = [
  {
    id: 0,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
    ],
  },
  {
    id: 1,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
    ],
  },
  {
    id: 2,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
    ],
  },
  {
    id: 3,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
    ],
  },
  {
    id: 4,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6",
    ],
  },
];
export const batchForInput = [
  {
    id: 0,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
    ],
  },
  {
    id: 1,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x805168dafc0c10ae31de2580541db0f5ee8ff53afb55e39a5e2eeb60f878553f",
    ],
  },
  {
    id: 2,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x6d22619e2866924f585b440543927bb4d21b8bdfac6e415fa156fc66f6a97af0",
    ],
  },
];

export const batchForInputResult = Promise.resolve([
  {
    jsonrpc: "2.0",
    result: {
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
        hash:
          "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
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
            type: null,
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
        reason: null,
        status: "committed",
      },
    },
    id: 0,
  },
  {
    jsonrpc: "2.0",
    result: {
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
        hash:
          "0x805168dafc0c10ae31de2580541db0f5ee8ff53afb55e39a5e2eeb60f878553f",
        header_deps: [
          "0x17a505353a671db2874b8a789a2706cab69579919ea577fe893d3a1686b211a4",
        ],
        inputs: [
          {
            previous_output: {
              index: "0x0",
              tx_hash:
                "0x1a50505b2a0a7e8eebb06fda96abcbff6551f2b5711ba8266fd4a6f35833aa05",
            },
            since: "0x0",
          },
          {
            previous_output: {
              index: "0x0",
              tx_hash:
                "0xe1a7cf802ef39c5395262f523962a5b4acee1292f4c51a92683604a59f991257",
            },
            since: "0x0",
          },
        ],
        outputs: [
          {
            capacity: "0x174876e800",
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
            capacity: "0x2dd219460",
            lock: {
              args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
              code_hash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
        ],
        outputs_data: ["0x785a440000000000", "0x"],
        version: "0x0",
        witnesses: [
          "0x550000001000000055000000550000004100000055cbfbab6e186567168bd7c1ab8651607fcf3b95c0c2f93615e8f163ad1d771759d7b5d749fef7b983a2329fd9bec13866d09867495d6878f3577708b8e33f3300",
          "0x",
        ],
      },
      tx_status: {
        block_hash:
          "0x7895667ef62cf0b4bc7be9485577d7feaf9c278fd1b50e9f66cdc3292cf32335",
        reason: null,
        status: "committed",
      },
    },
    id: 1,
  },
  {
    jsonrpc: "2.0",
    result: {
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
        hash:
          "0x6d22619e2866924f585b440543927bb4d21b8bdfac6e415fa156fc66f6a97af0",
        header_deps: [],
        inputs: [
          {
            previous_output: {
              index: "0x1",
              tx_hash:
                "0x1a50505b2a0a7e8eebb06fda96abcbff6551f2b5711ba8266fd4a6f35833aa05",
            },
            since: "0x0",
          },
        ],
        outputs: [
          {
            capacity: "0x746a528800",
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
            capacity: "0x5d21d892c0",
            lock: {
              args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
              code_hash:
                "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
              hash_type: "type",
            },
            type: null,
          },
        ],
        outputs_data: ["0x0000000000000000", "0x"],
        version: "0x0",
        witnesses: [
          "0x55000000100000005500000055000000410000002627a3084cdaefc999d1a310366c20e67a273f341dcd96cd5ca7fabf569425e77768a3e41c5de875c8ab7a671219bbe87ebe391732ef0417b7be7623eda30ee101",
        ],
      },
      tx_status: {
        block_hash:
          "0xdfd5fe561c5daeff59601bdd0673ec912148b5c13421aa9411624c93c15e0daf",
        reason: null,
        status: "committed",
      },
    },
    id: 2,
  },
]);

export const multipleInputQuery = {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as HashType,
    args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
  },
};
