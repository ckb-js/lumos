const test = require("ava");
const { CellProvider } = require("./cell_provider");
const { TransactionSkeleton } = require("@ckb-lumos/helpers");
const { createToken, transfer } = require("../lib/sudt");
const { bob, alice } = require("./account_info");
const { DEV_CONFIG } = require("./dev_config");
const { readBigUInt128LE } = require("@ckb-lumos/base/lib/utils");

const bobInputs = [
  {
    cell_output: {
      capacity: "0x11714b8ff7f3",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
    },
    out_point: {
      tx_hash:
        "0xdfb045db368f62f18068d967635829109d97360315a466bd0d84049ee2202d64",
      index: "0x0",
    },
    block_hash:
      "0x9c995d9301eea7e3dfbba778871840b174cafdd7bc7beeac6395cb1a1aa2f18a",
    block_number: "0x83",
    data: "0x",
  },
];

const sudtInputs = [
  {
    cell_output: {
      capacity: "0x34e62ce00",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        code_hash:
          "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
        hash_type: "data",
        args:
          "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    out_point: {
      tx_hash:
        "0xd8a1b9386977ee29d801655790779c2e89bd5253a31b9458194fa057a33c2b4d",
      index: "0x0",
    },
    block_hash:
      "0xe91fe71b7f8efddc2a6d4991bfd6fbd539b528908775b62ef832af2f554daa3f",
    block_number: "0x1aeee",
    data: "0x10270000000000000000000000000000",
  },
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        code_hash:
          "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
        hash_type: "data",
        args:
          "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    out_point: {
      tx_hash:
        "0x8d68c43620b513545519b6950969d79bdeee617f65fee6a2cde668b2e9e4c719",
      index: "0x0",
    },
    block_hash:
      "0x6f1c914ef1cd907983d51a8a09e5d6c501a2d1e39d9bc782025c92c665fb6993",
    block_number: "0x1aef4",
    data: "0x10270000000000000000000000000000",
  },
];
const sudtToken =
  "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d";

test("createToken", async (t) => {
  const cellProvider = new CellProvider(bobInputs);

  let txSkeleton = TransactionSkeleton({ cellProvider });

  const amount = 1000n;
  txSkeleton = await createToken(
    txSkeleton,
    bob.testnetAddress,
    amount,
    14200000000n,
    { config: DEV_CONFIG }
  );

  const expectedWitnesses = [
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  ];

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.deepEqual(txSkeleton.get("witnesses").toArray(), expectedWitnesses);

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, 0n);

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, 0n);

  t.is(inputCapacity, outputCapacity);

  t.is(readBigUInt128LE(txSkeleton.get("outputs").get(0).data), amount);
});

test("transfer", async (t) => {
  const cellProvider = new CellProvider(sudtInputs);

  let txSkeleton = TransactionSkeleton({ cellProvider });

  const amount = 1000n;
  txSkeleton = await transfer(
    txSkeleton,
    bob.testnetAddress,
    sudtToken,
    alice.testnetAddress,
    amount,
    14200000000n,
    { config: DEV_CONFIG }
  );

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, 0n);

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, 0n);

  t.is(inputCapacity, outputCapacity);

  const inputAmount = txSkeleton
    .get("inputs")
    .map((i) => readBigUInt128LE(i.data))
    .reduce((result, c) => result + c, 0n);

  const outputAmount = txSkeleton
    .get("outputs")
    .map((o) => readBigUInt128LE(o.data))
    .reduce((result, c) => result + c, 0n);

  t.is(inputAmount, outputAmount);
  t.is(readBigUInt128LE(txSkeleton.get("outputs").get(0).data), amount);
});
