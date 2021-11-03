import test from "ava";
import { Indexer, CellCollector } from "../src";
const { lock, type, cellCollectorTestCases } = require("./test_cases.js");
import { HashType } from "@ckb-lumos/base";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

test("get count correct", async (t) => {
  const type = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type" as HashType,
    args: "0xa178db16d8228db82911fdb536df1916e761e205",
  };
  const cellCollector = new CellCollector(indexer, { lock: type });
  const count = await cellCollector.count();
  t.is(count, 1);
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
  const queryOptions = {
    lock: wrappedLock,
    type: wrappedType,
    argsLen: argsLen,
  };
  const cellCollector = new CellCollector(indexer, queryOptions);
  t.deepEqual(cellCollector.queries.lock, lock);
  t.deepEqual(cellCollector.queries.type, type);
});

test("pass Scrip to CellCollector", (t) => {
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen };
  const wrappedType = { script: type, argsLen: argsLen };
  const queryOptions = {
    lock: wrappedLock,
    type: wrappedType,
    argsLen: argsLen,
  };
  const cellCollector = new CellCollector(indexer, queryOptions);
  t.deepEqual(cellCollector.queries.lock, lock);
  t.deepEqual(cellCollector.queries.type, type);
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
        type: "empty" as "empty",
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
        order: "some" as "asc",
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
        order: "asc" as "asc",
        fromBlock: "1000",
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
        order: "asc" as "asc",
        toBlock: "0x",
      };
      new CellCollector(indexer, queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});
