import test from "ava";
import { Indexer, CellCollector } from "../src";
import { HexadecimalRange, Script, utils, Cell } from "@ckb-lumos/base";
import { spy, SinonSpy, stub } from "sinon";
import { validators } from "@ckb-lumos/toolkit";
import { CKBIndexerQueryOptions } from "../src/type";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

let validateScriptSpy: SinonSpy;
let utilsSpy: SinonSpy;
test.before(() => {
  validateScriptSpy = spy(validators, "ValidateScript");
  utilsSpy = spy(utils, "assertHexadecimal");
});
test.afterEach(() => {
  validateScriptSpy.resetHistory();
});
const lockScript: Script = {
  codeHash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hashType: "type",
  args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
};

// convertParams tests
test("convertParams# should set outputDataLenRange according to data", (t) => {
  const query = {
    lock: lockScript,
    data: "0x",
  };
  const cellCollect = new CellCollector(indexer, query);
  cellCollect.convertQueryOptionToSearchKey();
  t.deepEqual(cellCollect.queries[0].outputDataLenRange, ["0x0", "0x1"]);
});

test("convertParams# should not set outputDataRange if data is not defined", (t) => {
  const query = {
    lock: lockScript,
  };
  const cellCollect = new CellCollector(indexer, query);
  cellCollect.convertQueryOptionToSearchKey();
  t.deepEqual(cellCollect.queries[0].outputDataLenRange, undefined);
});

test("convertParams# should match outputDataRange if data and outputData both defined", (t) => {
  const outputDataLenRange: HexadecimalRange = ["0x0", "0x2"];
  const query = {
    lock: lockScript,
    data: "0x",
    outputDataLenRange,
  };
  const cellCollect = new CellCollector(indexer, query);
  cellCollect.convertQueryOptionToSearchKey();
  t.deepEqual(cellCollect.queries[0].outputDataLenRange, ["0x0", "0x2"]);

  const notMatchQuery = {
    lock: lockScript,
    data: "0x664455",
    outputDataLenRange,
  };
  const error = t.throws(() => {
    new CellCollector(indexer, notMatchQuery);
  });
  t.is(error.message, "data length not match outputDataLenRange");
});

test("convertParams# should match scriptLenRange if type is 'empty' and scriptLenRange not provide", (t) => {
  const cellCollect = new CellCollector(indexer, {
    lock: lockScript,
    type: "empty",
    order: "asc",
  });
  cellCollect.convertQueryOptionToSearchKey();

  t.deepEqual(cellCollect.queries[0].scriptLenRange, ["0x0", "0x1"]);

  const cellCollect2 = new CellCollector(indexer, {
    lock: lockScript,
    scriptLenRange: ["0x0", "0xff"],
    type: "empty",
    order: "asc",
  });
  cellCollect2.convertQueryOptionToSearchKey();

  t.deepEqual(cellCollect2.queries[0].scriptLenRange, ["0x0", "0xff"]);
});

test("convertParams# should support multiple cell queies", (t) => {
  const cellCollector = new CellCollector(indexer, [
    {
      lock: lockScript,
      type: "empty",
      order: "asc",
    },
    {
      lock: lockScript,
      scriptLenRange: ["0x0", "0xff"],
      type: "empty",
      order: "asc",
    },
  ]);

  t.deepEqual(
    cellCollector.queries.map((query) => query.scriptLenRange),
    [
      ["0x0", "0x1"],
      ["0x0", "0xff"],
    ]
  );
});

// validateQueryOption tests
test("validateQueryOption#should throw error if lock and type not provided", (t) => {
  t.throws(
    () => {
      new CellCollector(indexer, {});
    },
    undefined,
    "throw error if lock and query both not provided"
  );

  t.throws(
    () => {
      new CellCollector(indexer, {
        type: "empty",
      });
    },
    undefined,
    "throw error if lock is not provided and type is empty"
  );
});

test("validateQueryOption#validate lock if lock is script", (t) => {
  const query = {
    lock: lockScript,
  };
  new CellCollector(indexer, query);
  t.is(validateScriptSpy.calledWith(query.lock), true);
});

test("validateQueryOption#validate lock.script if lock is ScriptWrapper", (t) => {
  const query = {
    lock: { script: lockScript, argsLen: 20 },
  };
  new CellCollector(indexer, query);
  t.is(validateScriptSpy.calledWith(query.lock.script), true);
});

test("validateQueryOption#validate type if type is script", (t) => {
  const query = {
    type: lockScript,
  };
  new CellCollector(indexer, query);
  t.is(validateScriptSpy.calledWith(query.type), true);
});

test("validateQueryOption#validate type.script if type is ScriptWrapper", (t) => {
  const query = {
    type: { script: lockScript, argsLen: 20 },
  };
  new CellCollector(indexer, query);
  t.is(validateScriptSpy.calledWith(query.type.script), true);
});

test("validateQueryOption#validate fromBlock", (t) => {
  const query = {
    lock: lockScript,
    fromBlock: "0x1",
  };
  new CellCollector(indexer, query);
  t.is(utilsSpy.calledWith("fromBlock", "0x1"), true);
});

test("validateQueryOption#validate toBlock", (t) => {
  const query = {
    lock: lockScript,
    toBlock: "0x3",
  };
  new CellCollector(indexer, query);
  t.is(utilsSpy.calledWith("toBlock", "0x3"), true);
});

test("validateQueryOption#validate outputCapacityRange", (t) => {
  const outputCapacityRange: HexadecimalRange = ["0x100", "0x200"];
  const query = {
    lock: lockScript,
    outputCapacityRange,
  };
  new CellCollector(indexer, query);
  t.is(utilsSpy.calledWith("outputCapacityRange[0]", "0x100"), true);
  t.is(utilsSpy.calledWith("outputCapacityRange[1]", "0x200"), true);
});

test("validateQueryOption#validate outputDataLenRange", (t) => {
  const outputDataLenRange: HexadecimalRange = ["0x100", "0x200"];
  const query = {
    lock: lockScript,
    outputDataLenRange,
  };
  new CellCollector(indexer, query);
  t.is(utilsSpy.calledWith("outputDataLenRange[0]", "0x100"), true);
  t.is(utilsSpy.calledWith("outputDataLenRange[1]", "0x200"), true);
});

test("validateQueryOption#validate scriptLenRange", (t) => {
  const scriptLenRange: HexadecimalRange = ["0x0", "0x1"];
  const query = {
    lock: lockScript,
    scriptLenRange,
  };
  new CellCollector(indexer, query);
  t.is(utilsSpy.calledWith("scriptLenRange[0]", "0x0"), true);
  t.is(utilsSpy.calledWith("scriptLenRange[1]", "0x1"), true);

  const wrongQuery = {
    lock: lockScript,
    data: "0x664455",
    scriptLenRange: ["something", "0x1"] as HexadecimalRange,
  };
  const error = t.throws(() => {
    new CellCollector(indexer, wrongQuery);
  });
  t.is(error.message, "scriptLenRange[0] must be a hexadecimal!");

  const wrongQuery2 = {
    lock: lockScript,
    data: "0x664455",
    scriptLenRange: ["0x0", "something"] as HexadecimalRange,
  };
  const error2 = t.throws(() => {
    new CellCollector(indexer, wrongQuery2);
  });
  t.is(error2.message, "scriptLenRange[1] must be a hexadecimal!");
});

test("validateQueryOption#validate should support multiple queries", (t) => {
  t.throws(
    () => {
      new CellCollector(indexer, [{ lock: lockScript }, {}]);
    },
    undefined,
    "throw error if lock and query both not provided in queryOption[1]"
  );

  t.throws(
    () => {
      new CellCollector(indexer, [{ lock: lockScript }, { type: "empty" }]);
    },
    undefined,
    "throw error if lock is not provided and type is empty in queryOption[1]"
  );
});

test("getLiveCell#should call terminableCellFetcher", async (t) => {
  const results = {
    lastCursor: "Paimon",
    objects: [],
  };
  const mockGetCells = stub().resolves(results);
  const mockCellFetcher: any = {
    getCells: mockGetCells,
  };
  const query: CKBIndexerQueryOptions = {
    lock: lockScript,
    bufferSize: 7,
    order: "asc" as const,
  };

  const cellCollector: any = new CellCollector(mockCellFetcher, query);
  const liveCell = await cellCollector.getLiveCell(query, "Lumine");
  t.deepEqual(liveCell, results);
  t.deepEqual(mockGetCells.lastCall.args[0].script, query.lock);
  t.deepEqual(mockGetCells.lastCall.args[0].scriptType, "lock");
  t.deepEqual(mockGetCells.lastCall.args[2], {
    sizeLimit: 7,
    order: "asc",
    lastCursor: "Lumine",
  });
});

test("shouldSkip#shouldSkip should works well", (t) => {
  const cellCollector: any = new CellCollector(indexer, []);

  // if skippedCount < query.skip, skip current cell
  t.true(cellCollector.shouldSkipped({ skip: 5 }, {}, 0));

  // type does not match
  t.true(
    cellCollector.shouldSkipped(
      { type: "empty" },
      { cellOutput: { type: "data" } }
    )
  );

  // fitler data
  t.false(cellCollector.shouldSkipped({ data: "0x12" }, { data: "0x1234" }));
  t.false(
    cellCollector.shouldSkipped(
      { data: { data: "0x12", searchMode: "prefix" } }, // correct prefix
      { data: "0x1234" }
    )
  );
  t.true(
    cellCollector.shouldSkipped(
      { data: { data: "0x66", searchMode: "prefix" } }, // wrong prefix
      { data: "0x1234" }
    )
  );
  t.false(
    cellCollector.shouldSkipped(
      { data: { data: "0x12", searchMode: "exact" } }, // correct prefix, but not exactly the same
      { data: "0x1234" }
    )
  );
  t.true(cellCollector.shouldSkipped({ data: "0x5678" }, { data: "0x1234" })); // wrong prefix
  t.true(
    cellCollector.shouldSkipped(
      { data: { data: "0x5678", searchMode: "exact" } }, // not same at all
      { data: "0x1234" }
    )
  );

  /// args len does not match it's in query
  t.true(
    cellCollector.shouldSkipped(
      { argsLen: 77 },
      { cellOutput: { lock: lockScript } }
    )
  );
});

// The CellCollector#collect method also be covered by E2E tests
test("collect#should return and uniq the returning of `collectBySingleQuery`", async (t) => {
  const cellCollector: any = new CellCollector(indexer, [
    { lock: lockScript },
    { lock: lockScript },
  ]);

  const mockCells: Cell[] = [
    {
      cellOutput: {
        capacity: "0x66858222c400",
        lock: {
          codeHash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
        },
      },
      outPoint: {
        txHash:
          "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c",
        index: "0x22c",
      },
      data: "0x",
    },
    {
      cellOutput: {
        capacity: "0x1ad91ea879",
        lock: {
          codeHash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0xa528f2b9a51118b193178db4cf2f3db92e7df323",
        },
      },
      outPoint: {
        txHash:
          "0xdd01a213077bdb161c7f5ef5071e15b911ba5d1692148f8c7a009873610eedbf",
        index: "0x0",
      },
      data: "0x",
    },
  ];

  cellCollector.collectBySingleQuery = async function* () {
    for (const cell of mockCells) {
      yield cell;
    }
  };

  const cells: Cell[] = [];

  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  t.deepEqual(cells, mockCells);
});
