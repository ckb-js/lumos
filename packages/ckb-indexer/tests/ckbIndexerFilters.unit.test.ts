import test from "ava";
import { filterBy } from "../src/ckbIndexerFilter";
import { Cell, Script } from "@ckb-lumos/base";

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
