import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import { Order } from "../src/indexer";
const {
  lock,
  transactionCollectorHashTestCases,
  transactionCollectorCollectTestCases,
} = require("./test_cases.js");

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
