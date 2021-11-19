import { QueryOptions, Script } from "@ckb-lumos/base";
import test from "ava";
const {
  lock,
} = require("./test_cases.js");
import { Indexer } from "../src";
const nodeUri = "http://127.0.0.1:8114";
const indexUri = "http://127.0.0.1:8116";
const indexer = new Indexer(nodeUri, indexUri);

test("subscribe cells", () => {
  const queryOption: QueryOptions = {
    lock: lock as Script,
  }
  const emitter = indexer.subscribe(queryOption);
  emitter.on('changed', console.log)
});

test("subscribe emitMedian TimeEvents", () => {
  const handle = (e: unknown) => {
    console.log(e)
  }
  const eventEmitter = indexer.subscribeMedianTime();
  eventEmitter.on("changed", handle);  
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
  t.is(error.message, "unimplemented");
});
