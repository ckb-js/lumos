import test from "ava";
import { sudt } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { Cell } from "@ckb-lumos/base";
import { bob, alice } from "./account_info";
import { predefined } from "@ckb-lumos/config-manager";
import { utils } from "@ckb-lumos/base";
import { isSudtScript } from "../src/helper";
const { readBigUInt128LE } = utils;
const { AGGRON4 } = predefined;

const secpInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

const sudtInputs: Cell[] = [
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
    data: "0x10270000000000000000000000000000",
    out_point: {
      tx_hash:
        "0x6747f0fa9ae72efc75079b5f7b2347f965df0754e22818f511750f1f2d08d2cc",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

test("createToken", async (t) => {
  const cellProvider = new CellProvider(secpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.createToken(
    txSkeleton,
    bob.testnetAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity, sumOfInputCapacity);

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(readBigUInt128LE(txSkeleton.get("outputs").get(0)!.data), amount);

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cell_output.type, AGGRON4)
  );
});

test("transfer", async (t) => {
  const cellProvider = new CellProvider(sudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const bobLockHash =
    "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d";

  const amount = BigInt(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bobLockHash,
    alice.testnetAddress,
    amount,
    bob.testnetAddress,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity, sumOfInputCapacity);

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cell_output.type)
    .map((i) => readBigUInt128LE(i.data))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cell_output.type)
    .map((i) => readBigUInt128LE(i.data))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputAmount, sumOfOutputAmount);

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(readBigUInt128LE(txSkeleton.get("outputs").get(0)!.data), amount);

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cell_output.type, AGGRON4)
  );
});
