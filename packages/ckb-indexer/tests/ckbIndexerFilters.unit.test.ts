import test from "ava";
import { filterBy, filterByQueryOptions } from "../src/ckbIndexerFilter";
import { Cell, Script } from "@ckb-lumos/base";
import { BI } from "@ckb-lumos/bi";

const dummyScript: Script = {
  codeHash: `0x${"00".repeat(32)}`,
  hashType: "type",
  args: "0x",
};

const lockScript: Script = { ...dummyScript, args: "0x1234" };
const typeScript: Script = { ...dummyScript, args: "0x5678" };

const mockCell: Required<Cell> = {
  blockNumber: "0x2",
  outPoint: {
    txHash: "0x",
    index: "0x2",
  },
  cellOutput: {
    capacity: "0x2",
    lock: lockScript,
    type: typeScript,
  },
  data: "0x1234",
  txIndex: "0x2",
  blockHash: "",
};

test("filter by correct script type", async (t) => {
  t.true(filterBy(mockCell, { scriptType: "lock", script: lockScript }));
  t.true(filterBy(mockCell, { scriptType: "type", script: typeScript }));
});

test("filter by wrong script type", async (t) => {
  t.false(filterBy(mockCell, { scriptType: "type", script: lockScript }));
  t.false(filterBy(mockCell, { scriptType: "lock", script: typeScript }));
});

test("filter default to prefix mode", async (t) => {
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: { ...lockScript, args: "0x12" },
    })
  );
});

test("filter explicitly set to exact mode", async (t) => {
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: { ...lockScript, args: "0x12" },
      scriptSearchMode: "exact",
    })
  );
});

test("filter with block range", async (t) => {
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { blockRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { blockRange: ["0x10", "0x11"] },
    })
  );
});

test("filter with output capacity range", async (t) => {
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputCapacityRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputCapacityRange: ["0x10", "0x11"] },
    })
  );
});

test("filter with output data length range", async (t) => {
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputDataLenRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputDataLenRange: ["0x10", "0x11"] },
    })
  );
});

const originalCells: Cell[] = [
  createCell({ dataLen: 10 }),
  createCell({ capacity: BI.from(100) }),
  createCell({ blockNumber: BI.from(200) }),
  createCell({ type: dummyScript }),
  createCell({
    lock: {
      ...dummyScript,
      args: "0x1234",
    },
  }),
  createCell({
    lock: {
      ...dummyScript,
      args: "0x12345678",
    },
    type: {
      ...dummyScript,
      args: "0x1234",
    },
  }),
];

test("must provide lock or type in query options", async (t) => {
  t.throws(() => filterByQueryOptions(originalCells, {}));
});

test("should filter lock with exact mode", async (t) => {
  const cells1 = filterByQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells1, originalCells.slice(0, 4));
});

test("should filter with output data len range", async (t) => {
  const cells2 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    outputDataLenRange: [BI.from(10).toHexString(), BI.from(200).toHexString()],
  });
  t.deepEqual(cells2, [originalCells[0]]);
});

test("should filter with output capacity range", async (t) => {
  const cells3 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    outputCapacityRange: [
      BI.from(10).toHexString(),
      BI.from(200).toHexString(),
    ],
  });
  t.deepEqual(cells3, [originalCells[1]]);
});

test("should filter with from block", async (t) => {
  const cells4 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    fromBlock: BI.from(10).toHexString(),
  });
  t.deepEqual(cells4, [originalCells[2]]);
});

test("should filter type with exact mode", async (t) => {
  const cells5 = filterByQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells5, [originalCells[3]]);
});

test("should filter script len range", async (t) => {
  const cells6 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    scriptLenRange: [BI.from(100).toHexString(), BI.from(200).toHexString()],
  });
  t.deepEqual(cells6, []);
});

test("should filter by data", async (t) => {
  const cells7 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: "0x00000000000000000000",
  });
  t.deepEqual(cells7, [originalCells[0]]);
});

test("should filter by data with default prefix mode", async (t) => {
  const cells8 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: "0x00",
  });
  t.deepEqual(cells8, [originalCells[0]]);
});

test("should filter by data with explicitly prefix mode", async (t) => {
  const cells9 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: {
      data: "0x00",
      searchMode: "prefix",
    },
  });
  t.deepEqual(cells9, [originalCells[0]]);
});

test("should filter by data with explicitly exact mode", async (t) => {
  const cells10 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: {
      data: "0x00",
      searchMode: "exact",
    },
  });
  t.deepEqual(cells10, []);
});

// test case 11 is removed due to duplicated with test case 3

test("should filter with lock script args len", async (t) => {
  const cells12 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    argsLen: 2,
  });
  t.deepEqual(cells12, [originalCells[4]]);
});

test("should filter by type with exact mode then reverse", async (t) => {
  const cells13 = filterByQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
    order: "desc",
  });
  t.deepEqual(cells13, originalCells.slice(0, 4).reverse());
});

test("should filter by type with exact mode then skip 1", async (t) => {
  const cells14 = filterByQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
    skip: 1,
  });
  t.deepEqual(cells14, originalCells.slice(1, 4));
});

test("should filter by type with prefix mode and lock script args length", async (t) => {
  const cells15 = filterByQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "prefix",
    },
    argsLen: 4,
  });
  t.deepEqual(cells15, [originalCells[5]]);
});

test("should filter with empty type script", async (t) => {
  const cells16 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    type: "empty",
  });
  t.deepEqual(cells16, [...originalCells.slice(0, 3), originalCells[4]]);
});

function createCell(payload: {
  lock?: Script;
  type?: Script;
  dataLen?: number;
  capacity?: BI;
  blockNumber?: BI;
}): Cell {
  const { lock, type, dataLen, capacity, blockNumber } = payload;
  return {
    blockNumber: blockNumber?.toHexString() || "0x1",
    cellOutput: {
      capacity: capacity?.toHexString() || "0x1",
      lock: lock || dummyScript,
      type: type || undefined,
    },
    data: "0x" + "00".repeat(dataLen || 0),
  };
}
