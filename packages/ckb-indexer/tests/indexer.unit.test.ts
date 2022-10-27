import { HashType, Script, OutPoint } from "@ckb-lumos/base";
import test from "ava";
import { stub } from "sinon";
import { Indexer, RPC as IndexerRPC, TerminableCellAdapter } from "../src";
import {
  CKBIndexerQueryOptions,
  IndexerEmitter,
  IndexerCell,
} from "../src/type";
const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);

test.before(() => {
  // @ts-ignore
  stub(indexer, "scheduleLoop").callsFake(() => {});
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

const genRandomHex = (size: number) =>
  "0x" +
  [...Array(size - 2)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

type GenerateCellOptions = {
  blockNumber?: string;
  txIndex?: string;
  outPoint?: OutPoint;
  capacity?: string;
  lock?: Script;
  type?: Script;
  outputData?: string;
};

function genIndexerCell({
  blockNumber = genRandomHex(16),
  txIndex = genRandomHex(16),
  outPoint = {
    txHash: genRandomHex(66),
    index: genRandomHex(2),
  },
  capacity = genRandomHex(16),
  lock = {
    codeHash: genRandomHex(66),
    hashType: "type",
    args: genRandomHex(66),
  },
  type = {
    codeHash: genRandomHex(66),
    hashType: "type",
    args: genRandomHex(66),
  },
  outputData = genRandomHex(66),
}: GenerateCellOptions = {}): IndexerCell {
  return {
    blockNumber,
    outPoint,
    output: {
      capacity,
      lock,
      type,
    },
    outputData,
    txIndex,
  };
}

test("test TerminableCellAdapter", async (t) => {
  const indexerRpc = new IndexerRPC(indexUri);
  const MOCK_LOCK_SCRIPT: Script = {
    codeHash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    hashType: "data",
    args: "0x",
  };
  const MOCK_COUNT = 5;
  const mockCells = [...Array(MOCK_COUNT)].map(() =>
    genIndexerCell({ lock: MOCK_LOCK_SCRIPT })
  );

  stub(indexerRpc, "getCells").callsFake(() =>
    Promise.resolve({
      lastCursor: "0x",
      objects: mockCells,
    })
  );

  const adapter = new TerminableCellAdapter(indexerRpc);
  const result = await adapter.getCells(
    {
      script: MOCK_LOCK_SCRIPT,
      scriptType: "lock",
    },
    undefined
  );

  t.deepEqual(result.objects.length, MOCK_COUNT);
  t.deepEqual(result.objects[0].cellOutput, mockCells[0].output);
  t.deepEqual(result.objects[0].data, mockCells[0].outputData);
  t.deepEqual(result.objects[0].outPoint, mockCells[0].outPoint);

  const stoptedResult = await adapter.getCells(
    {
      script: MOCK_LOCK_SCRIPT,
      scriptType: "lock",
    },
    (_, cell) => ({ stop: cell.data === mockCells[2].outputData, push: true })
  );

  t.deepEqual(stoptedResult.objects.length, 3);
});
