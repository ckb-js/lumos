const test = require("ava");
const { CellCollector } = require("../lib");
test("wrap plain Script into ScriptWrapper ", (t) => {
  const lock = {
    args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
  };
  const type = {
    code_hash:
      "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
    hash_type: "type",
    args: "0x",
  };
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen };
  const wrappedType = { script: type, argsLen: argsLen };
  const queryOptions = { lock: lock, type: type, argsLen: 20 };
  const cellCollector = new CellCollector("indexer placeholder", queryOptions);
  t.deepEqual(cellCollector.lock, wrappedLock);
  t.deepEqual(cellCollector.type, wrappedType);
});

test("pass ScriptWrapper to CellCollector", (t) => {
  const lock = {
    args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
  };
  const type = {
    code_hash:
      "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
    hash_type: "type",
    args: "0x",
  };
  const argsLen = 20;
  const wrappedLock = { script: lock, argsLen: argsLen };
  const wrappedType = { script: type, argsLen: argsLen };
  const queryOptions = { lock: wrappedLock, type: wrappedType, argsLen: 20 };
  const cellCollector = new CellCollector("indexer placeholder", queryOptions);
  t.deepEqual(cellCollector.lock, wrappedLock);
  t.deepEqual(cellCollector.type, wrappedType);
});

test("throw error when pass null lock and null type to CellCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {};
      new CellCollector("indexer placeholder", queryOptions);
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
      new CellCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});

test("throw error when pass wrong order to CellCollector", (t) => {
  const error = t.throws(
    () => {
      const queryOptions = {
        lock: {
          args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        order: "some",
      };
      new CellCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Order must be either asc or desc!");
});

test("throw error when pass wrong fromBlock(toBlock) to CellCollector", (t) => {
  let error = t.throws(
    () => {
      const queryOptions = {
        lock: {
          args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        order: "asc",
        fromBlock: 1000,
      };
      new CellCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "fromBlock must be a hexadecimal!");

  error = t.throws(
    () => {
      const queryOptions = {
        lock: {
          args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        order: "asc",
        toBlock: "0x",
      };
      new CellCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});
