import test from "ava";
import uniqBy from "lodash.uniqby";
import { Indexer, CellCollector } from "../src";
const {
  lock,
  type,
  cellCollectorTestCases,
  queryWithBlockHash,
} = require("./test_cases.js");
import { HashType, Cell } from "@ckb-lumos/base";
import { OtherQueryOptions } from "../src/type";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("get count correct", async (t) => {
  const type = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type" as HashType,
    args: "0xa178db16d8228db82911fdb536df1916e761e205",
  };
  const cellCollector = new CellCollector(indexer, { lock: type });
  const count = await cellCollector.count();
  t.is(count, 1);
});

test("get count correct with multiple tests", async (t) => {
  const type = {
    codeHash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "type" as HashType,
    args: "0xa178db16d8228db82911fdb536df1916e761e205",
  };
  const cellCollector = new CellCollector(indexer, [
    { lock: type },
    {
      lock: {
        ...type,
        args: "0x7ae354c3586ea3e7da6f30af80046fbe0cdce2fd",
      },
    },
  ]);
  const count = await cellCollector.count();
  t.is(count, 2);

  const cellCollect2 = new CellCollector(indexer, [
    { lock: type },
    { lock: type },
  ]);

  const count2 = await cellCollect2.count();
  t.is(count2, 1);
});

test("query cells with block hash", async (t) => {
  const otherQueryOptions: OtherQueryOptions = {
    withBlockHash: true,
    ckbRpcUrl: nodeUri,
  };
  const cellCollector = new CellCollector(
    indexer,
    queryWithBlockHash.queryOption,
    otherQueryOptions
  );
  let cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }
  t.deepEqual(
    cells,
    queryWithBlockHash.expectedResult,
    queryWithBlockHash.desc
  );
});

test("query cells with different queryOptions", async (t) => {
  for (const queryCase of cellCollectorTestCases) {
    const cellCollector = new CellCollector(indexer, queryCase.queryOption);
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells, queryCase.expectedResult, queryCase.desc);
  }
});

test("query cells with multiple queryOptions", async (t) => {
  // FIXME why use the Array#map method will cause out of memory?
  const singleQuery: any[] = [];
  let expectedResult: any[] = [];

  for (const queryCase of cellCollectorTestCases) {
    singleQuery.push(queryCase.queryOption);
    expectedResult.push(...queryCase.expectedResult);
  }

  expectedResult = uniqBy(
    expectedResult,
    (cell: Cell) => `${cell.outPoint?.txHash}-${cell.outPoint?.index}`
  );

  let cells: Cell[] = [];
  const cellCollector = new CellCollector(indexer, singleQuery);
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  t.deepEqual(cells, expectedResult);
});

test("implectly query duplicate queryOption", async (t) => {
  const cellCollector = new CellCollector(indexer, [
    cellCollectorTestCases[0].queryOption,
    cellCollectorTestCases[0].queryOption,
  ]);

  let cells: Cell[] = [];

  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  t.deepEqual(cells, cellCollectorTestCases[0].expectedResult);
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
  t.deepEqual(cellCollector.queries[0].lock, lock);
  t.deepEqual(cellCollector.queries[0].type, type);
});

test("pass Script to CellCollector", (t) => {
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen };
  const wrappedType = { script: type, argsLen: argsLen };
  const queryOptions = {
    lock: wrappedLock,
    type: wrappedType,
    argsLen: argsLen,
  };
  const cellCollector = new CellCollector(indexer, queryOptions);
  t.deepEqual(cellCollector.queries[0].lock, lock);
  t.deepEqual(cellCollector.queries[0].type, type);
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
