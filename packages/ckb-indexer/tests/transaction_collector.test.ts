import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import { SearchKey } from "../src/type";
const {
  lock,
  transactionCollectorHashTestCases,
  transactionCollectorCollectTestCases,
} = require("./test_cases.js");
import sinon, { SinonStub } from "sinon";
import * as services from "../src/services";
import {
  batchRequestIoTypeInput,
  getTransactionFromIndexerResult,
  ioTypeInputResult,
  queryOption,
  multipleInputCellTx,
  multipleInputCellBatchRequestResult,
  batchForAll,
  batchForInput,
  batchForInputResult,
  multipleInputQuery,
  batchRequest,
} from "./transaction_collector_special_test_case";
import { QueryOptions } from "@ckb-lumos/base";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);
let getTransactionsStub: SinonStub;
let requestBatchStub: SinonStub;
test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});
test("get count correct", async (t) => {
  const queryCase = transactionCollectorHashTestCases[0];
  const cellCollector = new TransactionCollector(
    indexer,
    queryCase.queryOption,
    nodeUri
  );
  const count = await cellCollector.count();
  t.is(count, 7);
});

test("get count correct with buffer 3 and skip 1", async (t) => {
  const queryCase = transactionCollectorHashTestCases[0];
  const newQueryOption = {
    ...queryCase.queryOption,
    ...{ skip: 1, bufferSize: 3 },
  };
  const cellCollector = new TransactionCollector(
    indexer,
    newQueryOption,
    nodeUri
  );
  const count = await cellCollector.count();
  t.is(count, 6);
});

test("get count correct if skip bigger than buffer size", async (t) => {
  const queryCase = transactionCollectorHashTestCases[0];
  const newQueryOption = {
    ...queryCase.queryOption,
    ...{ skip: 4, bufferSize: 3 },
  };
  const cellCollector = new TransactionCollector(
    indexer,
    newQueryOption,
    nodeUri
  );
  const count = await cellCollector.count();
  t.is(count, 3);
});

test("query transaction hash with different queryOptions", async (t) => {
  for (const queryCase of transactionCollectorHashTestCases) {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryCase.queryOption,
      nodeUri
    );
    let transactionHashes = [];
    for (const hash of await transactionCollector.getTransactionHashes()) {
      transactionHashes.push(hash);
    }
    t.deepEqual(transactionHashes, queryCase.expectedResult, queryCase.desc);
  }
});

test("query transactions with different queryOptions", async (t) => {
  for (const queryCase of transactionCollectorCollectTestCases) {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryCase.queryOption,
      nodeUri
    );
    let transactionList = [];
    for await (const hash of transactionCollector.collect()) {
      transactionList.push(hash);
    }
    t.deepEqual(transactionList, queryCase.expectedResult, queryCase.desc);
  }
});

test("throw error when pass null lock and null type to TransactionCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {};
      new TransactionCollector(indexer, queryOptions, nodeUri);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass null lock and empty type to TransactionCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {
        type: "empty" as "empty",
      };
      new TransactionCollector(indexer, queryOptions, nodeUri);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass wrong fromBlock(toBlock) to TransactionCollector", (t) => {
  let error = t.throws(
    () => {
      const queryOptions: QueryOptions = {
        lock: lock,
        order: "asc",
        toBlock: "0x",
      };
      new TransactionCollector(indexer, queryOptions, nodeUri);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});

test("input cell can be found in transaction detail", async (t) => {
  getTransactionsStub = sinon.stub(indexer, "getTransactions");
  requestBatchStub = sinon.stub(services, "requestBatch");
  const searchKey1: SearchKey = {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
    },
    script_type: "lock",
    filter: {},
  };
  const SearchFilter1 = { sizeLimit: undefined, order: undefined };
  getTransactionsStub
    .withArgs(searchKey1, SearchFilter1)
    .returns(getTransactionFromIndexerResult);
  const searchKey2: SearchKey = {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
    },
    script_type: "lock",
    filter: {},
  };
  const searchKeyFilter2 = {
    sizeLimit: undefined,
    order: undefined,
    lastCursor:
      "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
  };
  getTransactionsStub.withArgs(searchKey2, searchKeyFilter2).returns(
    Promise.resolve({
      lastCursor:
        "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
      objects: [],
    })
  );
  requestBatchStub.withArgs(...batchRequest.args).returns(batchRequest.result);
  requestBatchStub
    .withArgs(nodeUri, batchRequestIoTypeInput)
    .returns(ioTypeInputResult);
  const cellCollector = new TransactionCollector(indexer, queryOption, nodeUri);
  const count = await cellCollector.count();
  t.is(count, 1);
  getTransactionsStub.reset();
  requestBatchStub.reset();
  getTransactionsStub.restore();
  requestBatchStub.restore();
});

test("should add inputCell to all transaction which txHash and ioType is same as query", async (t) => {
  const searchKey: SearchKey = {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
    },
    script_type: "lock",
    filter: {},
  };
  const SearchFilter = { sizeLimit: undefined, order: undefined };
  getTransactionsStub
    .withArgs(searchKey, SearchFilter)
    .returns(multipleInputCellTx);
  requestBatchStub
    .withArgs(nodeUri, batchForAll)
    .returns(multipleInputCellBatchRequestResult);
  requestBatchStub
    .withArgs(nodeUri, batchForInput)
    .returns(batchForInputResult);
  const transactionCollector = new TransactionCollector(
    indexer,
    multipleInputQuery,
    nodeUri
  );
  const result = await transactionCollector.getTransactions();
  result.objects.forEach((tx) => {
    t.is(
      tx.transaction.hash,
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6"
    );
  });
  t.is(result.objects.length, 5);
  getTransactionsStub.reset();
  requestBatchStub.reset();
  getTransactionsStub.restore();
  requestBatchStub.restore();
});
