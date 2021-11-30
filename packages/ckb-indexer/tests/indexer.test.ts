import sinon from "sinon";
import test from "ava";
import fs from "fs";
import path from "path";
const { indexerSubscribeTestCases } = require("./test_cases.js");
import { Indexer } from "../src";
const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

test("subscribe cells", async (t) => {
  let blockIndex = 0;
  const stub = sinon.stub(indexer, "tip").callsFake(() => {
    const blocks = JSON.parse(
      fs
        .readFileSync(
          path.join(__dirname, "../../indexer/tests/blocks_data.json")
        )
        .toString()
    );
    const block = blocks[blockIndex];
    if (blockIndex !== 99) {
      blockIndex = blockIndex + 1;
    }
    return Promise.resolve({
      block_hash: block.header.hash,
      block_number: block.header.number,
    });
  });

  for (const queryCase of indexerSubscribeTestCases) {
    let spy = sinon.spy();
    const eventEmitter = indexer.subscribe(queryCase.queryOption);
    eventEmitter.on("changed", spy);
    await new Promise((resulve) => setTimeout(resulve, 10000));
    t.is(spy.callCount, queryCase.expectedResult, queryCase.desc);
    stub.resetHistory();
    blockIndex = 0;
    spy.resetHistory();
  }
});

test("subscribe emitMedian TimeEvents", async (t) => {
  const handle = (result: string) => {
    t.is(result, "0x17d3723d27d");
  };
  const eventEmitter = indexer.subscribeMedianTime();
  eventEmitter.on("changed", handle);
  await new Promise((resulve) => setTimeout(resulve, 1000));
});

test("throw error when pass both null lock and null type to subscribe", (t) => {
  const error = t.throws(
    () => {
      const queryOption = {};
      indexer.subscribe(queryOption);
    },
    { instanceOf: Error }
  );
  console.log(error);
  t.is(error.message, "Either lock or type script must be provided!");
});
