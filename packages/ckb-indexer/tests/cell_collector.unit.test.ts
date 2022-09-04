import test from "ava";
import { Indexer, CellCollector } from "../src";
import { HexadecimalRange, Script, utils } from "@ckb-lumos/base";
import { spy, SinonSpy } from "sinon";
import { validators } from "@ckb-lumos/toolkit";

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

test("convertParams# should set outputDataLenRange according to data", (t) => {
  const query = {
    lock: lockScript,
    data: "0x",
  };
  const cellCollect = new CellCollector(indexer, query);
  cellCollect.convertQueryOptionToSearchKey();
  t.deepEqual(cellCollect.queries.outputDataLenRange, ["0x0", "0x1"]);
});

test("convertParams# should not set outputDataRange if data is not defined", (t) => {
  const query = {
    lock: lockScript,
  };
  const cellCollect = new CellCollector(indexer, query);
  cellCollect.convertQueryOptionToSearchKey();
  t.deepEqual(cellCollect.queries.outputDataLenRange, undefined);
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
  t.deepEqual(cellCollect.queries.outputDataLenRange, ["0x0", "0x2"]);

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

  t.deepEqual(cellCollect.queries.scriptLenRange, ["0x0", "0x1"]);

  const cellCollect2 = new CellCollector(indexer, {
    lock: lockScript,
    scriptLenRange: ["0x0", "0xff"],
    type: "empty",
    order: "asc",
  });
  cellCollect2.convertQueryOptionToSearchKey();

  t.deepEqual(cellCollect2.queries.scriptLenRange, ["0x0", "0xff"]);
});

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
