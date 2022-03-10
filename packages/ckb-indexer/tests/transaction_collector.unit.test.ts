import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import { SearchKey } from "../src/type";
import sinon, { SinonStub } from "sinon";
import * as services from "../src/services";
import {
  batchRequestIoTypeInput,
  getTransactionFromIndexerResult,
  ioTypeInputResult,
  queryOption,
  multipleInputCellTx,
  multipleInputCellBatchRequestResult,
  batchForAll,
  batchForInput,
  batchForInputResult,
  multipleInputQuery,
  batchRequest,
} from "./transaction_collector_unit_test_case";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexUri = "http://127.0.0.1:8120";
const indexer = new Indexer(indexUri, nodeUri);
let getTransactionsStub: SinonStub;
let requestBatchStub: SinonStub;

test("input cell can be found in transaction detail", async (t) => {
  getTransactionsStub = sinon.stub(indexer, "getTransactions");
  requestBatchStub = sinon.stub(services, "requestBatch");
  const searchKey1: SearchKey = {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
    },
    script_type: "lock",
    filter: {},
  };
  const SearchFilter1 = { sizeLimit: undefined, order: undefined };
  getTransactionsStub
    .withArgs(searchKey1, SearchFilter1)
    .returns(getTransactionFromIndexerResult);
  const searchKey2: SearchKey = {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xbde8b19b4505dd1d1310223edecea20adc4e240e",
    },
    script_type: "lock",
    filter: {},
  };
  const searchKeyFilter2 = {
    sizeLimit: undefined,
    order: undefined,
    lastCursor:
      "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
  };
  getTransactionsStub.withArgs(searchKey2, searchKeyFilter2).returns(
    Promise.resolve({
      lastCursor:
        "0x809bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce801bde8b19b4505dd1d1310223edecea20adc4e240e000000000021420d000000010000000000",
      objects: [],
    })
  );
  requestBatchStub.withArgs(...batchRequest.args).returns(batchRequest.result);
  requestBatchStub
    .withArgs(nodeUri, batchRequestIoTypeInput)
    .returns(ioTypeInputResult);
  const cellCollector = new TransactionCollector(indexer, queryOption, nodeUri);
  const count = await cellCollector.count();
  t.is(count, 1);
  getTransactionsStub.reset();
  requestBatchStub.reset();
  getTransactionsStub.restore();
  requestBatchStub.restore();
});

test("should add inputCell to all transaction which txHash and ioType is same as query", async (t) => {
  const searchKey: SearchKey = {
    script: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xdfc8ad219178a307ff117ee4e2fe760cd18410a7",
    },
    script_type: "lock",
    filter: {},
  };
  const SearchFilter = { sizeLimit: undefined, order: undefined };
  getTransactionsStub
    .withArgs(searchKey, SearchFilter)
    .returns(multipleInputCellTx);
  requestBatchStub
    .withArgs(nodeUri, batchForAll)
    .returns(multipleInputCellBatchRequestResult);
  requestBatchStub
    .withArgs(nodeUri, batchForInput)
    .returns(batchForInputResult);
  const transactionCollector = new TransactionCollector(
    indexer,
    multipleInputQuery,
    nodeUri
  );
  const result = await transactionCollector.getTransactions();
  result.objects.forEach((tx) => {
    t.is(
      tx.transaction.hash,
      "0x87c3586cc91ec7a1a97407456dba0adb34c5781c6031cb71bfb175939af4e6c6"
    );
  });
  t.is(result.objects.length, 5);
  getTransactionsStub.reset();
  requestBatchStub.reset();
  getTransactionsStub.restore();
  requestBatchStub.restore();
});
