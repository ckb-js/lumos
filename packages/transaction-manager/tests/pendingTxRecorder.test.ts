import test from "ava";
import { TransactionsManager } from "../src";
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

let service: TransactionsManager;
test.beforeEach(() => {
  service = new TransactionsManager({
    providers: {
      transactionSender: {
        sendTransaction: () =>
          Promise.resolve(sentDummyTxHash) as Promise<string>,
      },
      cellCollectorProvider: {
        collector: () =>
          new CKBCellCollector(
            {
              // @ts-ignore
              getCells: () => Promise.resolve({ objects: [] }),
            },
            {
              lock: dummyLock,
            }
          ),
      },
    },
  });
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
      {
        capacity: "0x0",
        lock: dummyLock,
      },
    ],
    outputsData: ["0x", "0x"],
  });

  const txHash = await service.sendTransaction(mockTx);
  t.deepEqual(txHash, sentDummyTxHash);

  let cellCollector = await service.collector({ lock: dummyLock });
  let cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }
  t.deepEqual(cells.length, 2);
  t.deepEqual(cells[0], {
    cellOutput: mockTx.outputs[0],
    outPoint: {
      txHash: sentDummyTxHash,
      index: "0x0",
    },
    data: "0x",
  });
  t.deepEqual(cells[1], {
    cellOutput: mockTx.outputs[0],
    outPoint: {
      txHash: sentDummyTxHash,
      index: "0x1",
    },
    data: "0x",
  });
});

test("should 'skip' be ignored when collect cells", async (t) => {
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
      {
        capacity: "0x0",
        lock: dummyLock,
      },
    ],
    outputsData: ["0x", "0x"],
  });

  const txHash = await service.sendTransaction(mockTx);
  t.deepEqual(txHash, sentDummyTxHash);

  let cellCollector = await service.collector({ lock: dummyLock, skip: 1 });
  let cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }
  t.deepEqual(cells.length, 2);
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
