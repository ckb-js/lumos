const test = require("ava");
const sinon = require("sinon");
const fs = require("fs");
const { lock, type, indexerSubscribeTestCases } = require("./test_cases.js");
const { knex, migrateDbUp, migrateDbDown, Indexer } = require("./helper.js");
// the node_uri will not be connected during the test process, only serves as a placeholder when create an indexer instance.
const node_uri = "http://127.0.0.1:8114";
const blocksDataFilePath = __dirname + "/blocks_data.json";

const indexer = new Indexer(node_uri, knex);

test.before(async (t) => {
  await migrateDbUp(knex);
});

test.after(async (t) => {
  await migrateDbDown(knex);
});

test("test indexer subscribe by differen queryOptions", async (t) => {
  t.timeout(
    60 * 1000,
    "make sure enough time to reset database for each round test"
  );
  for (const queryCase of indexerSubscribeTestCases) {
    await indexer.clearDb(blocksDataFilePath);
    let spy = sinon.spy();
    const eventEmitter = indexer.subscribe(queryCase.queryOption);
    eventEmitter.on("changed", spy);
    await indexer.initDbFromJsonFile(blocksDataFilePath);
    t.is(spy.callCount, queryCase.expectedResult, queryCase.desc);
    spy.resetHistory();
  }
  await indexer.clearDb(blocksDataFilePath);
});

test("throw error when pass both lock and type to subscribe", (t) => {
  const error = t.throws(
    () => {
      const queryOption = { lock: lock, type: type };
      indexer.subscribe(queryOption);
    },
    { instanceOf: Error }
  );
  t.is(
    error.message,
    "The notification machanism only supports you subscribing for one script once so far!"
  );
});

test("throw error when pass both null lock and null type to subscribe", (t) => {
  const error = t.throws(
    () => {
      const queryOption = {};
      indexer.subscribe(queryOption);
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Either lock or type script must be provided!");
});
