import test from "ava";
import { PendingTransactionsManager } from "../src";
import * as sinon from "sinon";
import {
  Cell,
  Input,
  OutPoint,
  Output,
  Script,
  Transaction,
} from "@ckb-lumos/base";
import { CKBCellCollector } from "@ckb-lumos/ckb-indexer/lib/collector";

const dummyLock: Script = {
  codeHash: `0x${"00".repeat(32)}`,
  hashType: "type",
  args: "0x",
};

const dummyTxHash1 = `0x${"00".repeat(31)}00`;
const sentDummyTxHash = `0x${"00".repeat(31)}01`;

const dummyOutpoint1: OutPoint = {
  txHash: dummyTxHash1,
  index: "0x0",
};
const sentDummyOutpoint: OutPoint = {
  txHash: sentDummyTxHash,
  index: "0x0",
};

let service: PendingTransactionsManager;
test.beforeEach(() => {
  service = new PendingTransactionsManager({
    rpcUrl: "https://testnet.ckb.dev",
  });
  // @ts-ignore
  service.rpc = {
    sendTransaction: sinon.fake.resolves(sentDummyTxHash),
  };
  // @ts-ignore
  service.indexer = {
    collector: () => {
      return new CKBCellCollector(
        {
          // @ts-ignore
          getCells: () => Promise.resolve({ objects: [] }),
        },
        {
          lock: dummyLock,
        }
      );
    },
  };
  // @ts-ignore
  service.updatePendingTransactions = sinon.mock();
});
test.afterEach(() => {
  service.stop();
});

test("should collect cells", async (t) => {
  const mockTx = createMockTx({
    inputs: [
      {
        previousOutput: dummyOutpoint1,
        since: "0x0",
      },
    ],
    outputs: [
      {
        capacity: "0x0",
        lock: dummyLock,
      },
    ],
    outputsData: ["0x"],
  });

  const txHash = await service.sendTransaction(mockTx);
  t.deepEqual(txHash, sentDummyTxHash);

  const cellCollector = await service.collector({ lock: dummyLock });
  const cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }
  t.deepEqual(cells.length, 1);
  t.deepEqual(cells[0], {
    cellOutput: mockTx.outputs[0],
    outPoint: sentDummyOutpoint,
    data: "0x",
  });
});

function createMockTx(payload: {
  inputs: Input[];
  outputs: Output[];
  outputsData: string[];
}): Transaction {
  return {
    version: "0x0",
    cellDeps: [],
    headerDeps: [],
    inputs: payload.inputs || [],
    outputs: payload.outputs || [],
    outputsData: payload.outputsData || [],
    witnesses: [],
  };
}
