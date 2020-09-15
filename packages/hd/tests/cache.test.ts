import test from "ava";
import { Indexer, TransactionCollector } from "@ckb-lumos/indexer";

import { CacheManager } from "../src";
import { HDCache, getDefaultInfos } from "../src/cache";
import { Transaction, Cell, QueryOptions } from "@ckb-lumos/base";

const mockTxs: Transaction[] = [
  {
    version: "0",
    hash: "0xfd69760e8062dca9142a6802d7f42f82204e1b266719e34a17cc1f5c0bd03b97",
    header_deps: [],
    cell_deps: [],
    inputs: [
      {
        previous_output: {
          tx_hash:
            "0x58a29007f29ede069d49221f468107681c1a4d8d341de1d053b9b60596d6b233",
          index: "0x0",
        },
        since: "0x0",
      },
    ],
    outputs: [
      {
        capacity: "0x" + BigInt(1000 * 10 ** 8).toString(16),
        lock: {
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
          args: "0x89cba48c68b3978f185df19f31634bb870e94639",
        },
      },
    ],
    outputs_data: ["0x"],
    witnesses: [],
  },
  {
    version: "0",
    hash: "78a2d0c8da6daaa9e9cb7b2f69f90f3492719bb566e039d5c7d6a1534fcb301b",
    header_deps: [],
    cell_deps: [],
    inputs: [
      {
        previous_output: {
          tx_hash:
            "0xfd69760e8062dca9142a6802d7f42f82204e1b266719e34a17cc1f5c0bd03b97",
          index: "0x0",
        },
        since: "0x0",
      },
    ],
    outputs: [
      {
        capacity: "0x" + BigInt(200 * 10 ** 8).toString(16),
        lock: {
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
          args: "0x0ce445e32d7f91c9392485ddb9bc6885ce46ad64",
        },
      },
      {
        capacity: "0x" + BigInt(300 * 10 ** 8).toString(16),
        lock: {
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
          args: "0xaa5aa575dedb6f5d7a5c835428c3b4a3ea7ba1eb",
        },
      },
      {
        capacity: "0x" + BigInt(400 * 10 ** 8).toString(16),
        lock: {
          code_hash:
            "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hash_type: "type",
          args: "0xfa7b46aa28cb233db373e5712e16edcaaa4c4999",
        },
      },
    ],
    outputs_data: ["0x1234", "0x"],
    witnesses: [],
  },
];

class MockIndexer {
  async tip() {
    return {
      block_hash:
        "0xb97f00e2d023a9be5b38cc0dabcfdfa149597a3c5f6bc89b013c2cb69e186432",
      block_number: "0x10",
    };
  }
}

HDCache.receivingKeyInitCount = 3;
HDCache.changeKeyInitCount = 2;
HDCache.receivingKeyThreshold = 2;
HDCache.changeKeyThreshold = 1;

const mnemonic =
  "tank planet champion pottery together intact quick police asset flower sudden question";

/**
 * receiving keys blake160:
 * 0: 0x89cba48c68b3978f185df19f31634bb870e94639
 * 1: 0x0ce445e32d7f91c9392485ddb9bc6885ce46ad64
 * 2: 0xc337da539e4d0b89daad1370b945f7210fad4c43
 * 3: 0xd9a188cc1985a7d4a31f141f4ebb61f241aec182
 * 4: 0xebf9befcd8396e88cab8fcb920ab149231658f4b
 *
 * change keys blake160:
 * 0: 0xaa5aa575dedb6f5d7a5c835428c3b4a3ea7ba1eb
 * 1: 0xfa7b46aa28cb233db373e5712e16edcaaa4c4999
 * 2: 0xbba6e863e838bae614fd6df9828f3bf1eed57964
 * 3: 0x57a81755c7229decb0f21f93d73c1c7e1c0afe95
 */

class MockTransactionCollector extends TransactionCollector {
  async *collect() {
    const lock = (this as any).lock.script;
    const args = lock.args;
    if (args === "0x89cba48c68b3978f185df19f31634bb870e94639") {
      yield mockTxs[0];
    }
    if (
      [
        "0x89cba48c68b3978f185df19f31634bb870e94639",
        "0x0ce445e32d7f91c9392485ddb9bc6885ce46ad64",
        "0xaa5aa575dedb6f5d7a5c835428c3b4a3ea7ba1eb",
        "0xfa7b46aa28cb233db373e5712e16edcaaa4c4999",
      ].includes(args)
    ) {
      yield mockTxs[1];
    }
  }
}

const indexer = new MockIndexer();

const cacheManager = CacheManager.fromMnemonic(
  indexer as Indexer,
  mnemonic,
  getDefaultInfos(),
  {
    TransactionCollector: MockTransactionCollector,
  }
);

test("getBalance", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  const balance = cacheManager.getBalance();

  t.is(BigInt(balance), BigInt(900 * 10 ** 8));
});

test("derive threshold", async (t) => {
  const cacheManager = CacheManager.fromMnemonic(
    indexer as Indexer,
    mnemonic,
    getDefaultInfos(),
    {
      TransactionCollector: MockTransactionCollector,
    }
  );

  t.is(cacheManager.getReceivingKeys().length, 3);
  t.is(cacheManager.getChangeKeys().length, 2);

  // @ts-ignore
  await cacheManager.cache.loop();

  t.is(cacheManager.getReceivingKeys().length, 5);
  t.is(cacheManager.getChangeKeys().length, 3);

  t.deepEqual(
    cacheManager.getReceivingKeys().map((key) => key.index),
    Array.from({ length: 5 }).map((_, i) => i)
  );
  t.deepEqual(
    cacheManager.getChangeKeys().map((key) => key.index),
    Array.from({ length: 3 }).map((_, i) => i)
  );
});

test("cellCollector", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  const cells: Cell[] = [];
  for (const cell of cacheManager.cellCollector()) {
    cells.push(cell);
  }

  t.is(cells.length, 3);
  t.deepEqual(
    cells.map((cell) => BigInt(cell.cell_output.capacity)),
    [BigInt(200 * 10 ** 8), BigInt(300 * 10 ** 8), BigInt(400 * 10 ** 8)]
  );
});

test("cellCollectorByQueryOptions", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  const queryOptions: QueryOptions = {
    lock: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0x0ce445e32d7f91c9392485ddb9bc6885ce46ad64",
    },
  };

  const cells: Cell[] = [];
  for (const cell of cacheManager.cellCollectorByQueryOptions(queryOptions)) {
    cells.push(cell);
  }

  t.is(cells.length, 1);
  t.deepEqual(
    cells.map((cell) => BigInt(cell.cell_output.capacity)),
    [BigInt(200 * 10 ** 8)]
  );
});

test("getNextReceivingPublicKeyInfo", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  t.is(
    cacheManager.getNextReceivingPublicKeyInfo().blake160,
    "0xc337da539e4d0b89daad1370b945f7210fad4c43"
  );
});

test("getNextChangePublicKeyInfo", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  t.is(
    cacheManager.getNextChangePublicKeyInfo().blake160,
    "0xbba6e863e838bae614fd6df9828f3bf1eed57964"
  );
});
