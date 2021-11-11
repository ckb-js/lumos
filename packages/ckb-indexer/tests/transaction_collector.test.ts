import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import { Order } from "../src/indexer";
const { lock, transactionCollectorTestCases } = require("./test_cases.js");

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

//TODO test cursor,test skip, test input argLen

test("query transactions with different queryOptions", async (t) => {
  for (const queryCase of transactionCollectorTestCases) {
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
