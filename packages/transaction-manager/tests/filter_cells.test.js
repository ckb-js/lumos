const test = require("ava");
const TransactionManager = require("../lib");
const { utils } = require("@ckb-lumos/base");

const cells = [
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hashType: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        codeHash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hashType: "type",
        args:
          "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
  {
    cellOutput: {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
        hashType: "type",
        args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
      },
      type: undefined,
    },
    data: "0x",
    outPoint: {
      txHash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    blockHash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    blockNumber: "0x1",
  },
];

function computeHashCodes(cells) {
  return cells.map((cell) => {
    return utils.hashCode(Buffer.from(JSON.stringify(cell)));
  });
}

const transactionManager = new TransactionManager({ uri: "" });

test("filter by lock", (t) => {
  const filterdCells = transactionManager._filterCells(cells, {
    lock: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
  });

  t.is(filterdCells.length, 2);
  t.deepEqual(
    computeHashCodes(filterdCells),
    computeHashCodes([cells[0], cells[1]])
  );
});

test("filter by lock & empty type", (t) => {
  const filterdCells = transactionManager._filterCells(cells, {
    lock: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: "empty",
  });

  t.is(filterdCells.length, 1);
  t.deepEqual(computeHashCodes(filterdCells), computeHashCodes([cells[0]]));
});

test("filter by lock & type", (t) => {
  const filterdCells = transactionManager._filterCells(cells, {
    lock: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: {
      codeHash:
        "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
      hashType: "type",
      args:
        "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
    },
  });

  t.is(filterdCells.length, 1);
  t.deepEqual(computeHashCodes(filterdCells), computeHashCodes([cells[1]]));
});

test("filter by lock & data", (t) => {
  const filterdCells = transactionManager._filterCells(cells, {
    lock: {
      codeHash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hashType: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    data: "0x10270000000000000000000000000000",
  });

  t.is(filterdCells.length, 1);
  t.deepEqual(computeHashCodes(filterdCells), computeHashCodes([cells[1]]));
});

test("filter by lock & argsLen", (t) => {
  const filterdCells = transactionManager._filterCells(cells, {
    lock: {
      codeHash:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      hashType: "type",
      args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
    },
    argsLen: 28,
  });

  t.is(filterdCells.length, 1);
  t.deepEqual(computeHashCodes(filterdCells), computeHashCodes([cells[2]]));
});

test("filter by lock & argsLen, failed", (t) => {
  const filterdCells = transactionManager._filterCells(cells, {
    lock: {
      codeHash:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      hashType: "type",
      args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
    },
    argsLen: 27,
  });

  t.is(filterdCells.length, 0);
});
