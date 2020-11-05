const test = require("ava");
const { CellCollector } = require("../lib");
const { Indexer } = require("./helper.js");
const { lock, type, cellCollectorTestCases } = require("./test_cases.js");
// the nodeUri will not be connected during the test process, only serves as a placeholder when create an indexer instance.
const nodeUri = "http://127.0.0.1:8114";
const tmpIndexedDataPath = "/tmp/indexed_data";
const blocksDataFilePath = __dirname + "/blocks_data.json";
const indexer = new Indexer(nodeUri, tmpIndexedDataPath);

test.before(async (t) => {
  // setup rocksdb test data
  await indexer.initDbFromJsonFile(blocksDataFilePath);
});

test.after(async (t) => {
  await indexer.clearDb(blocksDataFilePath);
});

test("query cells with different queryOptions", async (t) => {
  for (const queryCase of cellCollectorTestCases) {
    const cellCollector = new CellCollector(indexer, queryCase.queryOption);
    let cells = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells, queryCase.expectedResult, queryCase.desc);
  }
});

test("wrap plain Script into ScriptWrapper ", (t) => {
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen };
  const wrappedType = { script: type, argsLen: argsLen };
  const queryOptions = { lock: lock, type: type, argsLen: argsLen };
  const cellCollector = new CellCollector(indexer, queryOptions);
  t.deepEqual(cellCollector.lock, wrappedLock);
  t.deepEqual(cellCollector.type, wrappedType);
});

test("pass ScriptWrapper to CellCollector", (t) => {
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen };
  const wrappedType = { script: type, argsLen: argsLen };
  const queryOptions = {
    lock: wrappedLock,
    type: wrappedType,
    argsLen: argsLen,
  };
  const cellCollector = new CellCollector(indexer, queryOptions);
  t.deepEqual(cellCollector.lock, wrappedLock);
  t.deepEqual(cellCollector.type, wrappedType);
});

test("throw error when pass null lock and null type to CellCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {};
      new CellCollector(indexer, queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass null lock and empty type to CellCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {
        type: "empty",
      };
      new CellCollector(indexer, queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass wrong order to CellCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {
        lock: lock,
        order: "some",
      };
      new CellCollector(indexer, queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Order must be either asc or desc!");
});

test("throw error when pass wrong fromBlock(toBlock) to CellCollector", (t) => {
  let error = t.throws(
    () => {
      const queryOptions = {
        lock: lock,
        order: "asc",
        fromBlock: 1000,
      };
      new CellCollector(indexer, queryOptions);
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
      new CellCollector(indexer, queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});
