import test from "ava";
import { Indexer, CellCollector } from "../src";
import { HexadecimalRange, Script } from "@ckb-lumos/base";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

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
