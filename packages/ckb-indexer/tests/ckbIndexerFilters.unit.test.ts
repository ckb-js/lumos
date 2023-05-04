import test from "ava";
import { filterBy, filterByQueryOptions } from "../src/ckbIndexerFilter";
import { Cell, Script } from "@ckb-lumos/base";
import { BI } from "@ckb-lumos/bi";

const dummyScript: Script = {
  codeHash: `0x${"00".repeat(32)}`,
  hashType: "type",
  args: "0x",
};

test("should filterBy function filters cell with searchKey", async (t) => {
  const script1: Script = { ...dummyScript, args: "0x1234" };
  const script2: Script = { ...dummyScript, args: "0x5678" };

  const mockCell: Required<Cell> = {
    blockNumber: "0x2",
    outPoint: {
      txHash: "0x",
      index: "0x2",
    },
    cellOutput: {
      capacity: "0x2",
      lock: script1,
      type: script2,
    },
    data: "0x1234",
    txIndex: "0x2",
    blockHash: "",
  };

  t.true(filterBy(mockCell, { scriptType: "lock", script: script1 }));
  t.true(filterBy(mockCell, { scriptType: "type", script: script2 }));
  t.false(filterBy(mockCell, { scriptType: "type", script: script1 }));
  t.false(filterBy(mockCell, { scriptType: "lock", script: script2 }));

  // should pass filter prefix mode
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: { ...script1, args: "0x12" },
    })
  );
  // should be blocked by filter in exact mode
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: { ...script1, args: "0x12" },
      scriptSearchMode: "exact",
    })
  );

  // filter with block range
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: script1,
      filter: { blockRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: script1,
      filter: { blockRange: ["0x10", "0x11"] },
    })
  );

  // filter with output capacity range
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: script1,
      filter: { outputCapacityRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: script1,
      filter: { outputCapacityRange: ["0x10", "0x11"] },
    })
  );

  // filter with output data length range
  t.true(
    filterBy(mockCell, {
      scriptType: "lock",
      script: script1,
      filter: { outputDataLenRange: ["0x1", "0x3"] },
    })
  );
  t.false(
    filterBy(mockCell, {
      scriptType: "lock",
      script: script1,
      filter: { outputDataLenRange: ["0x10", "0x11"] },
    })
  );
});

test("should filterByQueryOptions return expected cells", async (t) => {
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

  // must provide lock or type in query options
  t.throws(() => filterByQueryOptions(originalCells, {}));

  const cells1 = filterByQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells1, originalCells.slice(0, 4));

  const cells2 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    outputDataLenRange: [BI.from(10).toHexString(), BI.from(200).toHexString()],
  });
  t.deepEqual(cells2, [originalCells[0]]);

  const cells3 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    outputCapacityRange: [
      BI.from(10).toHexString(),
      BI.from(200).toHexString(),
    ],
  });
  t.deepEqual(cells3, [originalCells[1]]);

  const cells4 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    fromBlock: BI.from(10).toHexString(),
  });
  t.deepEqual(cells4, [originalCells[2]]);

  const cells5 = filterByQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells5, [originalCells[3]]);

  const cells6 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    scriptLenRange: [BI.from(100).toHexString(), BI.from(200).toHexString()],
  });
  t.deepEqual(cells6, []);

  const cells7 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: "0x00000000000000000000",
  });
  t.deepEqual(cells7, [originalCells[0]]);

  const cells8 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: "0x00",
  });
  t.deepEqual(cells8, [originalCells[0]]);

  const cells9 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: {
      data: "0x00",
      searchMode: "prefix",
    },
  });
  t.deepEqual(cells9, [originalCells[0]]);

  const cells10 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    data: {
      data: "0x00",
      searchMode: "exact",
    },
  });
  t.deepEqual(cells10, []);

  const cells11 = filterByQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "exact",
    },
  });
  t.deepEqual(cells11, [originalCells[3]]);

  const cells12 = filterByQueryOptions(originalCells, {
    lock: dummyScript,
    argsLen: 2,
  });
  t.deepEqual(cells12, [originalCells[4]]);

  const cells13 = filterByQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
    order: "desc",
  });
  t.deepEqual(cells13, originalCells.slice(0, 4).reverse());

  const cells14 = filterByQueryOptions(originalCells, {
    lock: {
      script: dummyScript,
      searchMode: "exact",
    },
    skip: 1,
  });
  t.deepEqual(cells14, originalCells.slice(1, 4));

  const cells15 = filterByQueryOptions(originalCells, {
    type: {
      script: dummyScript,
      searchMode: "prefix",
    },
    argsLen: 4,
  });
  t.deepEqual(cells15, [originalCells[5]]);
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
