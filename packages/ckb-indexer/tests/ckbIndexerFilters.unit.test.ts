import test from "ava";
import { isCellAfterCursor, filterBy } from "../src/ckbIndexerFilter";
import { Cell, Script } from "@ckb-lumos/base";
import { encodeCursor } from "../src/indexerCursor";
import { BI } from "@ckb-lumos/bi";

const dummyScript: Script = {
  codeHash: `0x${"00".repeat(32)}`,
  hashType: "type",
  args: "0x",
};

test("should isCellAfterCursor work fine", async (t) => {
  const mockCell: Required<Cell> = createMockCell();

  t.false(
    isCellAfterCursor({ cell: mockCell, cursor: cursorOfCell(mockCell) })
  );

  // minus 1 to cursor blockNumber
  t.true(
    isCellAfterCursor({
      cell: mockCell,
      cursor: cursorOfCell({
        ...mockCell,
        blockNumber: BI.from(mockCell.blockNumber).sub(1).toHexString(),
      }),
    })
  );

  // minus 1 to cursor txIndex
  t.true(
    isCellAfterCursor({
      cell: mockCell,
      cursor: cursorOfCell({
        ...mockCell,
        txIndex: BI.from(mockCell.txIndex).sub(1).toHexString(),
      }),
    })
  );

  // minus 1 to cursor output index
  t.true(
    isCellAfterCursor({
      cell: mockCell,
      cursor: cursorOfCell({
        ...mockCell,
        outPoint: {
          ...mockCell.outPoint,
          index: BI.from(mockCell.outPoint.index).sub(1).toHexString(),
        },
      }),
    })
  );
});

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

function createMockCell(options?: Partial<Cell>): Required<Cell> {
  const mockCell = {
    blockNumber: "0x2",
    outPoint: {
      txHash: "0x",
      index: "0x2",
    },
    cellOutput: {
      capacity: "0x1234",
      lock: dummyScript,
      type: undefined,
    },
    data: "0x1234",
    txIndex: "0x2",
    blockHash: "",
  };
  return {
    ...mockCell,
    ...options,
  };
}

function cursorOfCell(cell: Required<Cell>) {
  return encodeCursor({
    searchType: "lock",
    script: cell.cellOutput.lock,
    blockNumber: cell.blockNumber,
    txIndex: cell.txIndex,
    outputIndex: cell.outPoint.index,
  });
}
