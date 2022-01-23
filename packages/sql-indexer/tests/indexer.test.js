const test = require("ava");
const sinon = require("sinon");
const { lock, type, indexerSubscribeTestCases } = require("./test_cases.js");
const { knex, Indexer } = require("./helper.js");
// the nodeUri will not be connected during the test process, only serves as a placeholder when create an indexer instance.
const nodeUri = "http://127.0.0.1:8114";
const blocksDataFilePath = __dirname + "/blocks_data.json";

const indexer = new Indexer(nodeUri, knex);

test.before(async () => {
  await knex.migrate.up();
});

test.before(() => {
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test.after(async () => {
  await knex.migrate.down();
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
