const test = require("ava");
const { TransactionCollector } = require("../lib");
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
        lock: {
          args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
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
        lock: {
          args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
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
        lock: {
          args: "0x92aad3bbab20f225cff28ec1d856c6ab63284c7a",
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
        },
        order: "asc",
        toBlock: "0x",
      };
      new TransactionCollector("indexer placeholder", queryOptions);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "toBlock must be a hexadecimal!");
});
