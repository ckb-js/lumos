const test = require("ava");
const { TransactionCollector } = require("../lib");
const { Indexer, knexForTransactionCollector: knex } = require("./helper.js");
const {
  lock,
  type,
  transactionCollectorTestCases,
} = require("./test_cases.js");

// the nodeUri will not be connected during the test process, only serves as a placeholder when create an indexer instance.
const nodeUri = "http://127.0.0.1:8115";
const blocksDataFilePath = __dirname + "/blocks_data.json";
const indexer = new Indexer(nodeUri, knex);

test.before(async () => {
  await knex.migrate.up();
  await indexer.initDbFromJsonFile(blocksDataFilePath);
});

test.before(() => {
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test.after(async () => {
  await knex.migrate.down();
});

test("query transactions with different queryOptions", async (t) => {
  for (const queryCase of transactionCollectorTestCases) {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryCase.queryOption
    );
    let transactionHashes = [];
    const hashes = await transactionCollector.getTransactionHashes();
    for (const hash of hashes) {
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
  const transactionCollector = new TransactionCollector(indexer, queryOptions);
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
  const transactionCollector = new TransactionCollector(indexer, queryOptions);
  t.deepEqual(transactionCollector.lock, wrappedLock);
  t.deepEqual(transactionCollector.type, wrappedType);
});

test("throw error when pass null lock and null type to TransactionCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {};
      new TransactionCollector(indexer, queryOptions);
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
      new TransactionCollector(indexer, queryOptions);
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
      new TransactionCollector(indexer, queryOptions);
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
      new TransactionCollector(indexer, queryOptions);
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
      new TransactionCollector(indexer, queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});
