const test = require("ava");
const sinon = require("sinon");
const fs = require("fs");
const { Indexer } = require("../lib");
const { indexerSubscribeTestCases } = require("./indexer_subscribe_cases.js");
// the node_uri will not be connected during the test process, only serves as a placeholder when create an indexer instance.
const node_uri = "http://127.0.0.1:8116";
const tmpIndexedDataPath = __dirname + "/tmp_indexed_data3";
const blocksDataFilePath = __dirname + "/blocks_data.json";
const indexer = new Indexer(node_uri, tmpIndexedDataPath);

test("test indexer subscribe by differen queryOptions", async (t) => {
  t.timeout(
    60 * 1000,
    "make sure enough time to reset database for each round test"
  );
  for (const queryCase of indexerSubscribeTestCases) {
    // clear rocksdb test data if exists
    fs.rmdirSync(tmpIndexedDataPath, { recursive: true });
    let spy = sinon.spy();
    const eventEmitter = indexer.subscribe(queryCase.queryOption);
    eventEmitter.on("changed", spy);
    // setup rocksdb test data
    await indexer.init_db_from_json_file(blocksDataFilePath);
    // TODO: make sure the above code is sync executed(which should be even without the manully set delay)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    t.is(spy.callCount, queryCase.expectedResult, queryCase.desc);
    spy.resetHistory();
    // clear rocksdb test data
    fs.rmdirSync(tmpIndexedDataPath, { recursive: true });
  }
});
