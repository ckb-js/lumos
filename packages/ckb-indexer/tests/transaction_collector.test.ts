import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import { Order } from "../src/type";
const {
  lock,
  transactionCollectorHashTestCases,
  transactionCollectorCollectTestCases,
} = require("./test_cases.js");
import sinon from "sinon";
import * as services from "../src/services";
import {
  batchRequestAllIoType,
  batchRequestIoTypeInput,
  batchRequestResult,
  getTransactionFromIndexerResult,
  ioTypeInputResult,
  queryOption,
} from "./transaction_collector_special_test_case";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

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
      const queryOptions = {
        lock: lock,
        order: "asc" as Order,
        toBlock: "0x",
      };
      new TransactionCollector(indexer, queryOptions, nodeUri);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});

test("input cell can be found in transaction detail", async (t) => {
  const getTransactionsStub = sinon.stub(indexer, "getTransactions");
  getTransactionsStub.onCall(0).returns(getTransactionFromIndexerResult);
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
  getTransactionsStub.restore();
  requestBatchStub.restore();
});
