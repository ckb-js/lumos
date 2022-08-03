import { HashType } from "@ckb-lumos/base";
import test from "ava";
import sinon from "sinon";
import { Indexer } from "../src";
import { IndexerEmitter } from "../src/type";
const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

test.before(() => {
  sinon.stub(indexer, "scheduleLoop").callsFake(() => {});
});

test("test subscript", (t) => {
  const queryOption = {
    lock: {
      codeHash:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      hashType: "type" as HashType,
      args: "0x0000000000000000000000000000000000000000000000000000000000000002",
    },
  };
  const result: IndexerEmitter = indexer.subscribe(queryOption);

  t.deepEqual(result.lock, queryOption.lock);
  t.deepEqual(result.type, undefined);
});
