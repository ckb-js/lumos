import { HashType } from "@ckb-lumos/base";
import test from "ava";
import sinon from "sinon";
import { Indexer } from "../src";
import { CKBIndexerQueryOptions, IndexerEmitter } from "../src/type";
const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

test.before(() => {
  // @ts-ignore
  sinon.stub(indexer, "scheduleLoop").callsFake(() => {});
});

test("test subscrib by script", (t) => {
  const queryOption: CKBIndexerQueryOptions = {
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

test("test subscrib by scriptWrapper", (t) => {
  const queryOption: CKBIndexerQueryOptions = {
    lock: {
      script: {
        codeHash:
          "0x0000000000000000000000000000000000000000000000000000000000000001",
        hashType: "type" as HashType,
        args: "0x0000000000000000000000000000000000000000000000000000000000000002",
      },
    },
  };
  const error = t.throws(
    () => {
      indexer.subscribe(queryOption);
    },
    { instanceOf: Error }
  );
  t.is(
    error.message,
    "script does not have correct keys! Required keys: [args, codeHash, hashType], optional keys: [], actual keys: [script]"
  );
  // TODO should work fine here
  // const result: IndexerEmitter = indexer.subscribe(queryOption);
  // t.deepEqual(result.lock, queryOption.lock.script);
  // t.deepEqual(result.type, undefined);
});
