const test = require("ava");
const { TransactionCollector } = require("../lib");
const { Indexer } = require("./helper.js");
const {
  lock,
  type,
  transactionCollectorTestCases,
} = require("./test_cases.js");
const fs = require("fs");
// the node_uri will not be connected during the test process, only serves as a placeholder when create an indexer instance.
const node_uri = "http://127.0.0.1:8115";
const tmpIndexedDataPath = "/tmp/indexed_data2";
const blocksDataFilePath = __dirname + "/blocks_data.json";
const indexer = new Indexer(node_uri, tmpIndexedDataPath);

test.before(async (t) => {
  // setup rocksdb test data
  await indexer.initDbFromJsonFile(blocksDataFilePath);
});

test.after(async (t) => {
  await indexer.clearDb(blocksDataFilePath);
});

test("query transactions with different queryOptions", async (t) => {
  for (const queryCase of transactionCollectorTestCases) {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryCase.queryOption
    );
    let transactionHashes = [];
    for (const hash of transactionCollector.getTransactionHashes()) {
      transactionHashes.push(hash);
    }
    t.deepEqual(transactionHashes, queryCase.expectedResult, queryCase.desc);
  }
});

test("wrap plain Script into ScriptWrapper ", (t) => {
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen, ioType: "both" };
  const wrappedType = { script: type, argsLen: argsLen, ioType: "both" };
  const queryOptions = { lock: lock, type: type, argsLen: argsLen };
  const transactionCollector = new TransactionCollector(
    "indexer placeholder",
    queryOptions
  );
  t.deepEqual(transactionCollector.lock, wrappedLock);
  t.deepEqual(transactionCollector.type, wrappedType);
});

test("pass ScriptWrapper to TransactionCollector", (t) => {
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen, ioType: "input" };
  const wrappedType = { script: type, argsLen: argsLen, ioType: "input" };
  const queryOptions = {
    lock: wrappedLock,
    type: wrappedType,
    argsLen: argsLen,
  };
  const transactionCollector = new TransactionCollector(
    "indexer placeholder",
    queryOptions
  );
  t.deepEqual(transactionCollector.lock, wrappedLock);
  t.deepEqual(transactionCollector.type, wrappedType);
});

test("throw error when pass null lock and null type to TransactionCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {};
      new TransactionCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass null lock and empty type to TransactionCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {
        type: "empty",
      };
      new TransactionCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass wrong order to TransactionCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {
        lock: lock,
        order: "some",
      };
      new TransactionCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Order must be either asc or desc!");
});

test("throw error when pass wrong fromBlock(toBlock) to TransactionCollector", (t) => {
  let error = t.throws(
    () => {
      const queryOptions = {
        lock: lock,
        order: "asc",
        fromBlock: 1000,
      };
      new TransactionCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "fromBlock must be a hexadecimal!");

  error = t.throws(
    () => {
      const queryOptions = {
        lock: lock,
        order: "asc",
        toBlock: "0x",
      };
      new TransactionCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});
