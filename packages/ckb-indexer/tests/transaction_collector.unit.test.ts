import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import { JsonRprRequestBody } from "../src/type";
import sinon, { SinonSpy } from "sinon";
import * as services from "../src/services";

import {
  indexerTransactionListThatHaveOneIoTypeInput,
  indexerTransactionListThatHaveTwoIoTypeInput,
  indexerTransactionListThatHaveZeroIoTypeInput,
  unresolvedTransactionList,
  queryOption,
} from "./transaction_collector_unit_testcase";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);
let requestBatchSpy: SinonSpy;
test.before(() => {
  requestBatchSpy = sinon.spy(services, "requestBatch");
});
test.afterEach(() => {
  requestBatchSpy.resetHistory();
});
test.serial(
  "getResolvedTransactionRequestPayload# should return empty list if no indexerTransaction ioType is input",
  (t) => {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryOption,
      nodeUri
    );
    const resolvedTransactionList = transactionCollector.getResolvedTransactionRequestPayload(
      unresolvedTransactionList,
      indexerTransactionListThatHaveZeroIoTypeInput
    );
    const expectedResult: JsonRprRequestBody[] = [];
    t.deepEqual(resolvedTransactionList, expectedResult);
  }
);

test.serial(
  "getResolvedTransactionRequestPayload# should return correct requestPayload if one indexerTransaction ioType is input",
  (t) => {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryOption,
      nodeUri
    );
    const resolvedTransactionList = transactionCollector.getResolvedTransactionRequestPayload(
      unresolvedTransactionList,
      indexerTransactionListThatHaveOneIoTypeInput
    );
    const expectedResult: JsonRprRequestBody[] = [
      {
        id: 0,
        jsonrpc: "2.0",
        method: "get_transaction",
        params: [
          "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
        ],
      },
    ];
    t.deepEqual(resolvedTransactionList, expectedResult);
  }
);

test.serial(
  "getResolvedTransactionRequestPayload# should return correct requestPayload if two indexerTransaction ioType is input",
  (t) => {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryOption,
      nodeUri
    );
    const resolvedTransactionList = transactionCollector.getResolvedTransactionRequestPayload(
      unresolvedTransactionList,
      indexerTransactionListThatHaveTwoIoTypeInput
    );
    const expectedResult: JsonRprRequestBody[] = [
      {
        id: 0,
        jsonrpc: "2.0",
        method: "get_transaction",
        params: [
          "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
        ],
      },
      {
        id: 1,
        jsonrpc: "2.0",
        method: "get_transaction",
        params: [
          "0x805168dafc0c10ae31de2580541db0f5ee8ff53afb55e39a5e2eeb60f878553f",
        ],
      },
    ];
    t.deepEqual(resolvedTransactionList, expectedResult);
  }
);

test.serial("fetchResolvedTransaction#", async (t) => {
  const transactionCollector = new TransactionCollector(
    indexer,
    queryOption,
    nodeUri
  );
  const emptyPayload: JsonRprRequestBody[] = [];
  const emptyResolvedTransaction = await transactionCollector.fetchResolvedTransaction(
    emptyPayload
  );
  t.is(
    requestBatchSpy.called,
    false,
    "empty request payload should not call batchRequest"
  );
  t.deepEqual(
    emptyResolvedTransaction,
    [],
    "should return empty result if request payload is empty"
  );

  const payloadWithData: JsonRprRequestBody[] = [
    {
      id: 0,
      jsonrpc: "2.0",
      method: "get_transaction",
      params: [
        "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
      ],
    },
  ];
  const resolvedTransactionList = await transactionCollector.fetchResolvedTransaction(
    payloadWithData
  );
  t.is(
    requestBatchSpy.called,
    true,
    "should call batchRequest if request payload not empty"
  );
  t.is(resolvedTransactionList.length, 1, "should return correct length data");
});
