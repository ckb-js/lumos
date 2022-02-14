import sinon from "sinon";
import test from "ava";
import fs from "fs";
import path from "path";
const { indexerSubscribeTestCases } = require("./test_cases.js");
import { Indexer } from "../src";
const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);
test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

async function asyncRetry(
  callback: () => Promise<boolean> | boolean,
  interval: number,
  timeout: number
) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start >= timeout) throw new Error("timeout");
    const shouldBreak = await callback();
    if (shouldBreak) break;
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

test("subscribe cells", async (t) => {
  let blockIndex = 0;
  const stub = sinon.stub(indexer, "tip").callsFake(() => {
    const blocks = JSON.parse(
      fs.readFileSync(path.join(__dirname, "./blocks_data.json")).toString()
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

    asyncRetry(
      () => {
        return spy.callCount >= queryCase.expectedResult;
      },
      1000,
      10000
    ).then(() => {
      t.is(spy.callCount, queryCase.expectedResult, queryCase.desc);
      stub.resetHistory();
      blockIndex = 0;
      spy.resetHistory();
    });
  }
});

test("subscribe emitMedian TimeEvents", async (t) => {
  const expectedResult = "0x17d3723d27d";
  let result = "";
  const handle = (data: string) => {
    result = data;
  };
  const eventEmitter = indexer.subscribeMedianTime();
  eventEmitter.on("changed", handle);
  await asyncRetry(
    () => {
      return !!result;
    },
    1000,
    10000
  ).then(() => {
    t.is(result, expectedResult);
  });
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
