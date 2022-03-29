import test from "ava";
import { Indexer, CellCollector } from "../src";
import { HexadecimalRange, Script, utils } from "@ckb-lumos/base";
import sinon, { SinonSpy } from "sinon";
import { validators } from "@ckb-lumos/toolkit";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

let validateScriptSpy: SinonSpy;
let utilsSpy: SinonSpy;
test.before(() => {
  validateScriptSpy = sinon.spy(validators, "ValidateScript");
  utilsSpy = sinon.spy(utils, "assertHexadecimal");
});
test.afterEach(() => {
  validateScriptSpy.resetHistory();
});
const lockScript: Script = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
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
