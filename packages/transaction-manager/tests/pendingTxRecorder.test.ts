import test from "ava";
import {
  Cell,
  Input,
  OutPoint,
  Output,
  Script,
  Transaction,
} from "@ckb-lumos/base";
import { CKBCellCollector } from "@ckb-lumos/ckb-indexer/lib/collector";
import { TransactionManager } from "../src";
import { createInMemoryStorage } from "../src/store";
import { CKBIndexerQueryOptions } from "@ckb-lumos/ckb-indexer/lib/type";
import { createInMemoryPendingTransactionStorage } from "../src/TransactionStorage";

const dummyLock: Script = {
  codeHash: `0x${"00".repeat(32)}`,
  hashType: "type",
  args: "0x",
};

const dummyTxHash = `0x${"00".repeat(31)}00`;
const sentDummyTxHash = `0x${"00".repeat(31)}01`;

const dummyOutpoint1: OutPoint = {
  txHash: dummyTxHash,
  index: "0x0",
};

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

function cellOfTransaction(
  tx: Transaction,
  index: number,
  txHash?: string
): Cell {
  return {
    cellOutput: tx.outputs[index],
    data: tx.outputsData[index],
    outPoint: {
      txHash: txHash || sentDummyTxHash,
      index: "0x" + index.toString(16),
    },
  };
}

let service: TransactionManager;
test.beforeEach(() => {
  service = new TransactionManager({
    transactionSender: {
      sendTransaction: () =>
        Promise.resolve(sentDummyTxHash) as Promise<string>,
    },
    indexer: {
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
  });
});

test.serial("Store#should custom store works as expected", (t) => {
  type ProfileType = {
    name: string;
    age: number;
  };
  const store = createInMemoryStorage<ProfileType>();
  store.setItem("name", "JhonDoe");
  t.deepEqual(store.getItem("name"), "JhonDoe");
  t.deepEqual(store.hasItem("name"), true);
  t.deepEqual(store.hasItem("age"), false);
  store.removeItem("name");
  t.deepEqual(store.hasItem("name"), false);
});

test.serial(
  "TransactionStorage#should default TransactionStorage works as expected",
  async (t) => {
    const storage = createInMemoryPendingTransactionStorage();
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
          type: {
            ...dummyLock,
            args: "0x6666",
          },
        },
        {
          capacity: "0x0",
          lock: dummyLock,
        },
      ],
      outputsData: ["0x", "0x"],
    });
    const txWithHash = { ...mockTx, hash: sentDummyTxHash };
    await storage.addTransaction(txWithHash);
    t.deepEqual((await storage.getTransactions()).length, 1);
    t.deepEqual((await storage.getTransactions())[0], txWithHash);
  }
);

test.serial(
  "TransactionManager#should queryOptions be passed to Collector with skip ignored",
  (t) => {
    const exampleQueryOption: CKBIndexerQueryOptions = {
      lock: dummyLock,
      data: "0x12",
    };
    let cellCollector = service.collector(exampleQueryOption);
    //@ts-ignore
    t.deepEqual(cellCollector.queryOptions, { ...exampleQueryOption, skip: 0 });
  }
);

test.serial(
  "TransactionManager#should collect corresponding cells when query option has a lock",
  async (t) => {
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

    let cellCollector = service.collector({ lock: dummyLock });
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells.length, 2);
    t.deepEqual(cells[0], cellOfTransaction(mockTx, 0));
    t.deepEqual(cells[1], cellOfTransaction(mockTx, 1));
  }
);

test.serial(
  "TransactionManager#should collect corresponding cells when query option has data",
  async (t) => {
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
      outputsData: ["0x6666", "0x888888"],
    });

    const txHash = await service.sendTransaction(mockTx);
    t.deepEqual(txHash, sentDummyTxHash);

    let cellCollector = service.collector({ lock: dummyLock, data: "0x66" });
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells.length, 1);
    t.deepEqual(cells[0], cellOfTransaction(mockTx, 0));
  }
);

test.serial(
  "TransactionManager#should collect corresponding cells when query option has a type",
  async (t) => {
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
          type: {
            ...dummyLock,
            args: "0x6666",
          },
        },
        {
          capacity: "0x0",
          lock: dummyLock,
          type: {
            ...dummyLock,
            args: "0x8888",
          },
        },
      ],
      outputsData: ["0x", "0x"],
    });
    await service.sendTransaction(mockTx);

    let cellCollector = service.collector({
      type: {
        ...dummyLock,
        args: "0x66",
      },
    });
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells.length, 1);
    t.deepEqual(cells[0].cellOutput, mockTx.outputs[0]);

    // exact mode
    cellCollector = service.collector({
      type: {
        script: {
          ...dummyLock,
          args: "0x66",
        },
        searchMode: "exact",
      },
    });
    cells = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells.length, 0);
  }
);

test.serial(
  "TransactionManager#should 'skip' be ignored when collect cells",
  async (t) => {
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

    let cellCollector = service.collector({ lock: dummyLock, skip: 1 });
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells.length, 2);
  }
);

test.serial(
  "TransactionManager#should delete pending transaction when collected on-chain cell",
  async (t) => {
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

    const someOnChainCells = {
      objects: [cellOfTransaction(mockTx, 0)],
      lastCursor: "",
    };
    const empty = { objects: [], lastCursor: "" };
    let count = 0;
    service = new TransactionManager({
      transactionSender: {
        sendTransaction: () =>
          Promise.resolve(sentDummyTxHash) as Promise<string>,
      },
      indexer: {
        collector: () =>
          new CKBCellCollector(
            {
              //@ts-ignore
              getCells: () => {
                // resolves some on-chain cells only for once
                if (count === 0) {
                  count++;
                  return Promise.resolve(someOnChainCells);
                } else {
                  return Promise.resolve(empty);
                }
              },
            },
            {
              lock: dummyLock,
            }
          ),
      },
    });
    await service.sendTransaction(mockTx);

    let cellCollector = service.collector({ lock: dummyLock });
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }

    // only on-chain cell here
    t.deepEqual(cells.length, 1);
    t.deepEqual(cells[0], someOnChainCells.objects[0]);
  }
);

test.serial(
  "TransactionManager#should skip pending cells when usePendingOutputs is false",
  async (t) => {
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

    await service.sendTransaction(mockTx);

    let cellCollector = service.collector(
      { lock: dummyLock },
      { usePendingOutputs: false }
    );
    let cells: Cell[] = [];
    for await (const cell of cellCollector.collect()) {
      cells.push(cell);
    }
    t.deepEqual(cells.length, 0);
  }
);
