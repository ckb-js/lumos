import { HashType } from "@ckb-lumos/base";
import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import sinon from "sinon";
import { IOType } from "../src/type";
import * as services from "../src/services";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);
const queryOption = {
  lock: {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as HashType,
    args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
  },
};

const ioTypeInputResult = Promise.resolve([
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
    id:
      "0x1-0xc8a7917a9b269ca746f49177e75d4f5e7eb7ad20f79f44b079b5caecd4ffe96f",
  },
]);
const batchRequestIoTypeInput = [
  {
    id:
      "0x1-0xc8a7917a9b269ca746f49177e75d4f5e7eb7ad20f79f44b079b5caecd4ffe96f",
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
    ],
  },
];
const result = Promise.resolve({
  lastCursor:
    "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
  objects: [
    {
      block_number: "xxxxxxx",
      io_index: "0x1",
      io_type: "output" as IOType,
      tx_hash:
        "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
      tx_index: "0x2",
    },
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
const batchRequestAllIoType = [
  {
    id: 0,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0x02a002fc56640bf15cd43d06e0d31ec01acd69ef534c2223cd677d2df9316bc0",
    ],
  },
  {
    id: 1,
    jsonrpc: "2.0",
    method: "get_transaction",
    params: [
      "0xc8a7917a9b269ca746f49177e75d4f5e7eb7ad20f79f44b079b5caecd4ffe96f",
    ],
  },
];
const batchRequestResult = Promise.resolve([
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
    id: 1,
  },
]);
test("input cell can be found transaction detail", async (t) => {
  const getTransactionsStub = sinon.stub(indexer, "getTransactions");

  getTransactionsStub.onCall(0).returns(result);
  getTransactionsStub.onCall(1).returns(
    Promise.resolve({
      lastCursor:
        "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
      objects: [],
    })
  );
  const requestBatchStub = sinon.stub(services, "requestBatch");
  requestBatchStub
    .withArgs(nodeUri, batchRequestAllIoType)
    .returns(batchRequestResult);
  requestBatchStub
    .withArgs(nodeUri, batchRequestIoTypeInput)
    .returns(ioTypeInputResult);
  const cellCollector = new TransactionCollector(indexer, queryOption, nodeUri);
  const count = await cellCollector.count();
  t.is(count, 2);
  getTransactionsStub.reset();
  requestBatchStub.reset();
});
