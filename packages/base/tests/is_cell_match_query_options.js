const test = require("ava");
const { check } = require("../lib");
const { isCellMatchQueryOptions } = check;

const cells = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        code_hash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hash_type: "type",
        args:
          "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    out_point: {
      tx_hash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x2",
  },
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hash_type: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x5",
  },
];

function filterIndex(cells, queryOptions) {
  return cells
    .map((cell, index) => {
      if (isCellMatchQueryOptions(cell, queryOptions)) {
        return index;
      }
      return undefined;
    })
    .filter((index) => typeof index === "number");
}

test("filter by lock", (t) => {
  const queryOptions = {
    lock: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
  };

  t.deepEqual(filterIndex(cells, queryOptions), [0, 1]);
});

test("filter by lock & empty type", (t) => {
  const queryOptions = {
    lock: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: "empty",
  };

  t.deepEqual(filterIndex(cells, queryOptions), [0]);
});

test("filter by lock & type", (t) => {
  const queryOptions = {
    lock: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: {
      code_hash:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hash_type: "type",
      args:
        "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
    },
  };

  t.deepEqual(filterIndex(cells, queryOptions), [1]);
});

test("filter by lock & data", (t) => {
  const queryOptions = {
    lock: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    data: "0x10270000000000000000000000000000",
  };

  t.deepEqual(filterIndex(cells, queryOptions), [1]);
});

test("filter by lock & argsLen", (t) => {
  const queryOptions = {
    lock: {
      code_hash:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      hash_type: "type",
      args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
    },
    argsLen: 28,
  };

  t.deepEqual(filterIndex(cells, queryOptions), [2]);
});

test("filter by lock & argsLen, failed", (t) => {
  const queryOptions = {
    lock: {
      code_hash:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      hash_type: "type",
      args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
    },
    argsLen: 27,
  };

  t.deepEqual(filterIndex(cells, queryOptions), []);
});

test("filter by fromBlock", (t) => {
  const queryOptions = {
    fromBlock: "0x2",
  };
  t.deepEqual(filterIndex(cells, queryOptions), [1, 2]);
});

test("filter by toBlock", (t) => {
  const queryOptions = {
    toBlock: "0x2",
  };
  t.deepEqual(filterIndex(cells, queryOptions), [0, 1]);
});

test("filter by fromBlock & toBlock", (t) => {
  const queryOptions = {
    fromBlock: "0x3",
    toBlock: "0x6",
  };
  t.deepEqual(filterIndex(cells, queryOptions), [2]);
});

test("filter by argsLen = any", (t) => {
  t.deepEqual(
    filterIndex(cells, {
      lock: {
        code_hash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hash_type: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
      },
      argsLen: "any",
    }),
    [2]
  );

  t.deepEqual(
    filterIndex(cells, {
      argsLen: "any",
    }),
    [0, 1, 2]
  );
});
