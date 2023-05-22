import { randomBytes } from "crypto";
import test from "ava";
import { Indexer, TransactionCollector } from "../src";
import {
  indexerTransactionListThatHaveOneIoTypeInput,
  indexerTransactionListThatHaveTwoIoTypeInput,
  indexerTransactionListThatHaveZeroIoTypeInput,
  unresolvedTransactionList,
  queryOption,
} from "./transaction_collector_unit_test_case";
import { SinonStub, stub } from "sinon";
import * as services from "../src/services";
import { CKBComponents } from "@ckb-lumos/rpc/lib/types/api";
import { CkbIndexer } from "../src/indexer";
import { bytes } from "@ckb-lumos/codec";

const nodeUri = "http://127.0.0.1:8118/rpc";
const indexer = new Indexer(nodeUri);

let requestBatchTransactionWithStatusStub: SinonStub<
  Parameters<typeof services.requestBatchTransactionWithStatus>,
  ReturnType<typeof services.requestBatchTransactionWithStatus>
>;

test.before(() => {
  requestBatchTransactionWithStatusStub = stub(
    services,
    "requestBatchTransactionWithStatus"
  );
});
test.afterEach(() => {
  requestBatchTransactionWithStatusStub.resetHistory();
  requestBatchTransactionWithStatusStub.reset();
});

test.serial(
  "getResolvedTransactionRequestPayload# should return empty list if no indexerTransaction ioType is input",
  (t) => {
    const transactionCollector = new TransactionCollector(
      indexer,
      queryOption,
      nodeUri
    );
    const resolvedTransactionList =
      transactionCollector.getResolvedTransactionRequestPayload(
        unresolvedTransactionList,
        indexerTransactionListThatHaveZeroIoTypeInput
      );

    t.deepEqual(resolvedTransactionList, []);
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
    const resolvedTransactionList =
      transactionCollector.getResolvedTransactionRequestPayload(
        unresolvedTransactionList,
        indexerTransactionListThatHaveOneIoTypeInput
      );
    const expectedResult: string[] = [
      "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
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

    const resolvedTransactionList =
      transactionCollector.getResolvedTransactionRequestPayload(
        unresolvedTransactionList,
        indexerTransactionListThatHaveTwoIoTypeInput
      );
    const expectedResult: string[] = [
      "0x992208eab19d0f8ce5a2fc10579d8d614d265aa12851ea140ec717f2f41b925f",
      "0x805168dafc0c10ae31de2580541db0f5ee8ff53afb55e39a5e2eeb60f878553f",
    ];
    t.deepEqual(resolvedTransactionList, expectedResult);
  }
);

test.serial(
  "collect# should collect with a lock both in transaction inputs and outputs",
  async (t) => {
    const cellInInputTxHash = bytes.hexify(randomBytes(32));
    const cellInOutputTxHash = bytes.hexify(randomBytes(32));
    const targetCell = { lock: queryOption.lock, capacity: "0x0" };

    const txs: Record<string, CKBComponents.TransactionWithStatus> = {
      [cellInInputTxHash]: mockTxWithStatus({
        hash: cellInInputTxHash,
        inputs: [
          {
            previousOutput: { index: "0x0", txHash: cellInOutputTxHash },
            since: "0x0",
          },
        ],
        outputs: [targetCell],
      }),

      [cellInOutputTxHash]: mockTxWithStatus({
        hash: cellInOutputTxHash,
        inputs: [
          { previousOutput: { index: "0x0", txHash: "0x" }, since: "0x0" },
        ],
        outputs: [{ lock: queryOption.lock, capacity: "0x0" }],
      }),
    };

    // only affect the test case
    const scopedIndexer = new CkbIndexer("");

    stub(scopedIndexer, "getTransactions").callsFake(
      async (
        _,
        options
      ): Promise<CKBComponents.GetTransactionsResult<false>> => {
        // return empty result if lastCursor is 0xlast
        if (options?.lastCursor === "0xlast") {
          return { objects: [], lastCursor: "" };
        }

        return {
          objects: [
            {
              blockNumber: "0x",
              txHash: cellInInputTxHash,
              ioType: "input",
              txIndex: "0x0",
              ioIndex: "0x0",
            },
            {
              blockNumber: "0x",
              txHash: cellInOutputTxHash,
              ioType: "output",
              txIndex: "0x0",
              ioIndex: "0x0",
            },
          ],
          lastCursor: "0xlast",
        };
      }
    );

    requestBatchTransactionWithStatusStub.callsFake(async (_, txHashes) => {
      if (!txHashes.length) return [];

      return txHashes.map((hash) => {
        if (!txs[hash]) {
          throw new Error("Transaction not found" + hash);
        }
        return txs[hash];
      });
    });

    const transactionCollector = new TransactionCollector(
      scopedIndexer,
      queryOption,
      nodeUri
    );
    const results = [];
    for await (const tx of transactionCollector.collect()) {
      results.push(tx);
    }
    t.is(results.length, 2);

    const expectedCount = await transactionCollector.count();
    t.is(expectedCount, 2);

    const txHashes = await transactionCollector.getTransactionHashes();
    t.deepEqual(txHashes, [cellInInputTxHash, cellInOutputTxHash]);
  }
);

test.serial("collect# should collect works with ScriptWrapper", async (t) => {
  const indexer = new Indexer("");

  const targetLock: CKBComponents.Script = {
    codeHash: bytes.hexify(randomBytes(32)),
    hashType: "type",
    args: bytes.hexify(randomBytes(20)),
  };
  const targetType: CKBComponents.Script = {
    codeHash: bytes.hexify(randomBytes(32)),
    hashType: "type",
    args: bytes.hexify(randomBytes(20)),
  };

  const txHash = bytes.hexify(randomBytes(32));

  const txs: Record<string, CKBComponents.TransactionWithStatus> = {
    [txHash]: mockTxWithStatus({
      hash: txHash,
      inputs: [],
      outputs: [
        {
          lock: { ...targetLock, args: targetLock.args },
          type: targetType,
          capacity: "0x0",
        },
      ],
    }),
  };

  stub(indexer, "getTransactions").callsFake(async (_, options) => {
    if (options?.lastCursor === "0xlast") {
      return { objects: [], lastCursor: "" };
    }

    return {
      objects: [
        {
          blockNumber: "0x0",
          txHash,
          ioType: "output",
          ioIndex: "0x0",
          txIndex: "0x0",
        },
      ],
      lastCursor: "0xlast",
    };
  });

  requestBatchTransactionWithStatusStub.callsFake(async (_, txHashes) => {
    if (!txHashes.length) return [];
    return txHashes.map((hash) => txs[hash]);
  });

  const collector = new TransactionCollector(
    indexer,
    {
      lock: {
        script: targetLock,
        ioType: "output",
      },
      type: {
        script: targetType,
      },
    },
    nodeUri
  );

  const result1 = [];
  for await (const tx of collector.collect()) {
    result1.push(tx);
  }
  t.is(result1.length, 1);

  const collectorWith21BytesArgs = new TransactionCollector(
    indexer,
    {
      lock: {
        script: targetLock,
        ioType: "output",
        argsLen: 21,
      },
      type: {
        script: targetType,
      },
    },
    nodeUri
  );

  const result2 = [];
  for await (const tx of collectorWith21BytesArgs.collect()) {
    result2.push(tx);
  }

  t.is(
    result2.length,
    0,
    'Should not collect the tx since no "argsLen" with 21 bytes matches'
  );
});

function mockTxWithStatus({
  hash,
  inputs,
  outputs,
}: {
  hash: string;
  inputs: CKBComponents.CellInput[];
  outputs: CKBComponents.CellOutput[];
}): CKBComponents.TransactionWithStatus {
  return {
    transaction: {
      hash: hash,
      inputs: inputs,
      outputs: outputs,
      version: "0x1",
      headerDeps: [],
      outputsData: [],
      witnesses: [],
      cellDeps: [],
    },
    txStatus: { status: "committed" },
  };
}
