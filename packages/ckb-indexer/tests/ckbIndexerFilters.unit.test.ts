import test from "ava";
import {
  filterByLumosSearchKey,
  filterByLumosQueryOptions,
} from "../src/ckbIndexerFilter";
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

test("filterBySearchKey# filter by correct script type", async (t) => {
  t.true(
    filterByLumosSearchKey(mockCell, { scriptType: "lock", script: lockScript })
  );
  t.true(
    filterByLumosSearchKey(mockCell, { scriptType: "type", script: typeScript })
  );
});

test("filterBySearchKey# filter by wrong script type", async (t) => {
  t.false(
    filterByLumosSearchKey(mockCell, { scriptType: "type", script: lockScript })
  );
  t.false(
    filterByLumosSearchKey(mockCell, { scriptType: "lock", script: typeScript })
  );
});

test("filterBySearchKey# filter default to prefix mode", async (t) => {
  t.true(
    filterByLumosSearchKey(mockCell, {
      scriptType: "lock",
      script: { ...lockScript, args: "0x12" },
    })
  );
});

test("filterBySearchKey# filter explicitly set to exact mode", async (t) => {
  t.false(
    filterByLumosSearchKey(mockCell, {
      scriptType: "lock",
      script: { ...lockScript, args: "0x12" },
      scriptSearchMode: "exact",
    })
  );
});

test("filterBySearchKey# filter with output capacity range", async (t) => {
  t.true(
    filterByLumosSearchKey(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputCapacityRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterByLumosSearchKey(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputCapacityRange: ["0x10", "0x11"] },
    })
  );
});

test("filterBySearchKey# filter with output data length range", async (t) => {
  t.true(
    filterByLumosSearchKey(mockCell, {
      scriptType: "lock",
      script: lockScript,
      filter: { outputDataLenRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterByLumosSearchKey(mockCell, {
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

test("filterByLumosQueryOptions# must provide lock or type in query options", async (t) => {
  t.throws(() => filterByLumosQueryOptions(originalCells, {}));
});

test("filterByLumosQueryOptions# should filter lock with exact mode", async (t) => {
  const cells1 = filterByLumosQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells1, originalCells.slice(0, 4));
});

test("filterByLumosQueryOptions# should filter with output data len range", async (t) => {
  const cells2 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    outputDataLenRange: [BI.from(10).toHexString(), BI.from(200).toHexString()],
  });
  t.deepEqual(cells2, [originalCells[0]]);
});

test("filterByLumosQueryOptions# should filter with output capacity range", async (t) => {
  const cells3 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    outputCapacityRange: [
      BI.from(10).toHexString(),
      BI.from(200).toHexString(),
    ],
  });
  t.deepEqual(cells3, [originalCells[1]]);
});

// test case 4 is removed because of `fromBlock` is not supported

test("filterByLumosQueryOptions# should filter type with exact mode", async (t) => {
  const cells5 = filterByLumosQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells5, [originalCells[3]]);
});

test("filterByLumosQueryOptions# should filter script len range", async (t) => {
  const cells6 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    scriptLenRange: [BI.from(100).toHexString(), BI.from(200).toHexString()],
  });
  t.deepEqual(cells6, []);
});

test("filterByLumosQueryOptions# should filter by data", async (t) => {
  const cells7 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    data: "0x00000000000000000000",
  });
  t.deepEqual(cells7, [originalCells[0]]);
});

test("filterByLumosQueryOptions# should filter by data with default prefix mode", async (t) => {
  const cells8 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    data: "0x00",
  });
  t.deepEqual(cells8, [originalCells[0]]);
});

test("filterByLumosQueryOptions# should filter by data with explicitly prefix mode", async (t) => {
  const cells9 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    data: {
      data: "0x00",
      searchMode: "prefix",
    },
  });
  t.deepEqual(cells9, [originalCells[0]]);
});

test("filterByLumosQueryOptions# should filter by data with explicitly exact mode", async (t) => {
  const cells10 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    data: {
      data: "0x00",
      searchMode: "exact",
    },
  });
  t.deepEqual(cells10, []);
});

// test case 11 is removed due to duplicated with test case 3

test("filterByLumosQueryOptions# should filter with lock script args len", async (t) => {
  const cells12 = filterByLumosQueryOptions(originalCells, {
    lock: dummyScript,
    argsLen: 2,
  });
  t.deepEqual(cells12, [originalCells[4]]);
});

// test case 13 is removed because of `skip` is not supported
// test case 14 is removed because of `order` is not supported

test("filterByLumosQueryOptions# should filter by type with prefix mode and lock script args length", async (t) => {
  const cells15 = filterByLumosQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "prefix",
    },
    argsLen: 4,
  });
  t.deepEqual(cells15, [originalCells[5]]);
});

test("filterByLumosQueryOptions# should filter with empty type script", async (t) => {
  const cells16 = filterByLumosQueryOptions(originalCells, {
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
