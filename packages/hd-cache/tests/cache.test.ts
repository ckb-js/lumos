import test from "ava";
import { TransactionCollector, Indexer } from "@ckb-lumos/ckb-indexer";

import { CacheManager, getBalance } from "../src";
import {
  HDCache,
  getDefaultInfos,
  CellCollector,
  CellCollectorWithQueryOptions,
  publicKeyToMultisigArgs,
} from "../src/index";
import {
  Cell,
  QueryOptions,
  TransactionWithStatus,
  HexString,
  Script,
} from "@ckb-lumos/base";
import { BI } from "@ckb-lumos/bi";
import sinon from "sinon";

const mockTxs: TransactionWithStatus[] = [
  {
    transaction: {
      version: "0",
      hash:
        "0xfd69760e8062dca9142a6802d7f42f82204e1b266719e34a17cc1f5c0bd03b97",
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
    tx_status: {
      status: "committed",
      block_hash:
        "0x8df4763d10cf22509845f8ec728d56d1027d4dfe633cb91abf0d751ed5d45d68",
    },
  },
  {
    transaction: {
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
        // master public key
        {
          capacity: "0x" + BigInt(50 * 10 ** 8).toString(16),
          lock: {
            code_hash:
              "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
            hash_type: "type",
            args: "0xa6ee79109863906e75668acd75d6c6adbd56469c",
          },
        },
      ],
      outputs_data: ["0x1234", "0x", "0x"],
      witnesses: [],
    },
    tx_status: {
      status: "committed",
      block_hash:
        "0x8df4763d10cf22509845f8ec728d56d1027d4dfe633cb91abf0d751ed5d45d68",
    },
  },
];

class MockRpc {
  constructor() {}

  async get_header(blockHash: HexString) {
    return {
      compact_target: "0x1e083126",
      dao: "0xb5a3e047474401001bc476b9ee573000c0c387962a38000000febffacf030000",
      epoch: "0x7080018000001",
      hash: blockHash,
      nonce: "0x0",
      number: "0x400",
      parent_hash:
        "0xae003585fa15309b30b31aed3dcf385e9472c3c3e93746a6c4540629a6a1ed2d",
      proposals_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      timestamp: "0x5cd2b117",
      transactions_root:
        "0xc47d5b78b3c4c4c853e2a32810818940d0ee403423bea9ec7b8e566d9595206c",
      uncles_hash:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      version: "0x0",
    };
  }
}

const rpc: any = new MockRpc();

HDCache.receivingKeyInitCount = 3;
HDCache.changeKeyInitCount = 2;
HDCache.receivingKeyThreshold = 2;
HDCache.changeKeyThreshold = 1;

// Private Key: 0x37d25afe073a6ba17badc2df8e91fc0de59ed88bcad6b9a0c2210f325fafca61
// Public Key: 0x020720a7a11a9ac4f0330e2b9537f594388ea4f1cd660301f40b5a70e0bc231065
// blake160: 0xa6ee79109863906e75668acd75d6c6adbd56469c
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
  async *collect(): any {
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
        // master key
        "0xa6ee79109863906e75668acd75d6c6adbd56469c",
      ].includes(args)
    ) {
      yield mockTxs[1];
    }
  }
}
const type: Script = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0xa178db16d8228db82911fdb536df1916e761e205",
};
const indexer = new Indexer("", "");
const mockTransactionCollector = new MockTransactionCollector(
  indexer,
  {
    type,
  },
  ""
);
const tipStub = sinon.stub(indexer, "tip");
tipStub.resolves({
  block_hash:
    "0xb97f00e2d023a9be5b38cc0dabcfdfa149597a3c5f6bc89b013c2cb69e186432",
  block_number: "0x10",
});
const cacheManager = CacheManager.fromMnemonic(
  indexer,
  mnemonic,
  getDefaultInfos(),
  {
    transactionCollector: mockTransactionCollector,
    rpc,
  }
);

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("derive threshold", async (t) => {
  const cacheManager = CacheManager.fromMnemonic(
    indexer,
    mnemonic,
    getDefaultInfos(),
    {
      transactionCollector: mockTransactionCollector,
      rpc,
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

test("getMasterPublicKeyInfo, default", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  t.false(!!cacheManager.getMasterPublicKeyInfo());
});

test("getMasterPublicKeyInfo, needMasterPublicKey", async (t) => {
  const cacheManager = CacheManager.fromMnemonic(
    indexer,
    mnemonic,
    getDefaultInfos(),
    {
      transactionCollector: mockTransactionCollector,
      rpc,
      needMasterPublicKey: true,
    }
  );
  // @ts-ignore
  await cacheManager.cache.loop();

  t.true(!!cacheManager.getMasterPublicKeyInfo());
  t.is(
    cacheManager.getMasterPublicKeyInfo()!.publicKey,
    "0x020720a7a11a9ac4f0330e2b9537f594388ea4f1cd660301f40b5a70e0bc231065"
  );
});

test("loadFromKeystore, ckb-cli", async (t) => {
  const cacheManager = CacheManager.loadFromKeystore(
    indexer,
    __dirname + "/fixtures/ckb_cli_keystore.json",
    "aaaaaa",
    getDefaultInfos(),
    {
      transactionCollector: mockTransactionCollector,
    }
  );

  // @ts-ignore
  await cacheManager.cache.loop();

  t.true(!!cacheManager.getMasterPublicKeyInfo());
});

test("CellCollector", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  const cellCollector = new CellCollector(cacheManager);

  const cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  t.is(cells.length, 3);
  t.deepEqual(
    cells.map((cell) => BI.from(cell.cell_output.capacity).toString()),
    [
      BI.from(200).mul(BI.from(10).pow(8)).toString(),
      BI.from(300).mul(BI.from(10).pow(8)).toString(),
      BI.from(400).mul(BI.from(10).pow(8)).toString(),
    ]
  );

  const firstCell = cells[0];
  t.is(firstCell.block_number, "0x400");
  t.is(
    firstCell.block_hash,
    "0x8df4763d10cf22509845f8ec728d56d1027d4dfe633cb91abf0d751ed5d45d68"
  );
});

test("CellCollectorWithQueryOptions", async (t) => {
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

  const cellCollector = new CellCollectorWithQueryOptions(
    new CellCollector(cacheManager),
    queryOptions
  );

  const cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  t.is(cells.length, 1);
  t.deepEqual(
    cells.map((cell) => BI.from(cell.cell_output.capacity).toString()),
    [BI.from(200).mul(BI.from(10).pow(8)).toString()]
  );
});

test("CellCollectorWithQueryOptions, skip", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  const queryOptions: QueryOptions = {
    skip: 1,
  };

  const cellCollector = new CellCollectorWithQueryOptions(
    new CellCollector(cacheManager),
    queryOptions
  );

  const cells: Cell[] = [];
  for await (const cell of cellCollector.collect()) {
    cells.push(cell);
  }

  t.is(cells.length, 2);
  t.deepEqual(
    cells.map((cell) => BI.from(cell.cell_output.capacity).toString()),
    [
      BI.from(300).mul(BI.from(10).pow(8)).toString(),
      BI.from(400).mul(BI.from(10).pow(8)).toString(),
    ]
  );
});

test("getBalance", async (t) => {
  // @ts-ignore
  await cacheManager.cache.loop();

  const balance = await getBalance(new CellCollector(cacheManager));

  t.is(
    BI.from(balance).toString(),
    BI.from(900).mul(BI.from(10).pow(8)).toString()
  );
});

test("getBalance, needMasterPublicKey", async (t) => {
  const cacheManager = CacheManager.fromMnemonic(
    indexer,
    mnemonic,
    getDefaultInfos(),
    {
      transactionCollector: mockTransactionCollector,
      rpc,
      needMasterPublicKey: true,
    }
  );
  // @ts-ignore
  await cacheManager.cache.loop();

  const balance = await getBalance(new CellCollector(cacheManager));

  t.is(
    BI.from(balance).toString(),
    BI.from(950).mul(BI.from(10).pow(8)).toString()
  );
});

test("publicKeyToMultisigArgs", (t) => {
  const publicKey =
    "0x024a501efd328e062c8675f2365970728c859c592beeefd6be8ead3d901330bc01";
  const multisigArgs = "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8";

  t.is(publicKeyToMultisigArgs(publicKey), multisigArgs);
});
