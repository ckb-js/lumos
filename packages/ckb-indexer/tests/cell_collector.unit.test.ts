import test from "ava";
import { Indexer, CellCollector } from "../src";
import { HexadecimalRange, Script, utils } from "@ckb-lumos/base";
import sinon, { SinonSpy } from "sinon";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

let utilsSpy: SinonSpy;
test.before(() => {
  utilsSpy = sinon.spy(utils, "assertHexadecimal");
});
test.afterEach(() => {});
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
