import { Cell } from "@ckb-lumos/base";
import test from "ava";
import { anyoneCanPay } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { predefined } from "@ckb-lumos/config-manager";
import { bob, alice } from "./account_info";
const { AGGRON4 } = predefined;

const bobCell: Cell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      code_hash:
        "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
      hash_type: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: undefined,
  },
  data: "0x",
  out_point: {
    tx_hash:
      "0xcd56140e689205eeda3a0b853abf985f7cc405df758091601783844c18153527",
    index: "0x0",
  },
  block_hash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  block_number: "0x1",
};

const aliceCell: Cell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      code_hash:
        "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
      hash_type: "type",
      args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
    },
    type: undefined,
  },
  data: "0x",
  out_point: {
    tx_hash:
      "0x0a2955b8ac416a660bff138a8d33d1722086e264c5cdf5a33fea07e9613ec860",
    index: "0x0",
  },
  block_hash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  block_number: "0x1",
};

const bobAcpAddress =
  "ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykykdkr98kkxrtvuag8z2j8w4pkw2k6k4l5cgxhkrr";
const aliceAcpAddress =
  "ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyhcse8h6367zpzcqhj6e4k9a5lrevmpdaq9kve7y";

test("transfer", async (t) => {
  const cellProvider = new CellProvider([bobCell, aliceCell]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await anyoneCanPay.transfer(
    txSkeleton,
    bobAcpAddress,
    aliceAcpAddress,
    BigInt(500 * 10 ** 8),
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

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(
    txSkeleton.get("cellDeps").get(0)!.out_point.tx_hash,
    AGGRON4.SCRIPTS.ANYONE_CAN_PAY!.TX_HASH
  );

  t.is(txSkeleton.get("headerDeps").size, 0);

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cell_output.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cell_output.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  t.is(txSkeleton.get("witnesses").size, 2);
  t.is(txSkeleton.get("witnesses").get(0), "0x");
});

test("prepareSigningEntries", async (t) => {
  const cellProvider = new CellProvider([bobCell, aliceCell]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await anyoneCanPay.transfer(
    txSkeleton,
    bobAcpAddress,
    aliceAcpAddress,
    BigInt(500 * 10 ** 8),
    { config: AGGRON4 }
  );

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  const expectedMessage =
    "0xeb8b009b831ec0db5afb8a2b975e112099a8f2061e2a653c4b659ecb970277e4";

  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});
