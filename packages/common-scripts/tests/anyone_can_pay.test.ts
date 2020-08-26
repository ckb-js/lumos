import test from "ava";
import { anyoneCanPay } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
  minimalCellCapacity,
} from "@ckb-lumos/helpers";
import { predefined } from "@ckb-lumos/config-manager";
import { bob, alice } from "./account_info";
import { bobAcpCells, aliceAcpCells } from "./inputs";
import { Cell, values } from "@ckb-lumos/base";
const { AGGRON4 } = predefined;

test("withdraw, acp to acp, all", async (t) => {
  const cellProvider = new CellProvider([bobAcpCells[0], aliceAcpCells[0]]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.acpTestnetAddress,
    BigInt(1000 * 10 ** 8),
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
  t.is(txSkeleton.get("outputs").size, 1);

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
    [alice.blake160]
  );

  t.is(txSkeleton.get("witnesses").size, 2);
  t.is(txSkeleton.get("witnesses").get(0), "0x");

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0xfaf94f53f9f559ff69627a278949e0d9bcf7d5690bad04aa7de38d2bf962a033";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to acp, half", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const capacity = BigInt(500 * 10 ** 8);
  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.acpTestnetAddress,
    capacity,
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

  const aliceReceiveCapacity: bigint =
    BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity) -
    BigInt(txSkeleton.get("inputs").get(0)!.cell_output.capacity);

  t.is(aliceReceiveCapacity, capacity);

  t.is(txSkeleton.get("witnesses").size, 2);
  t.is(txSkeleton.get("witnesses").get(0), "0x");

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0xeb8b009b831ec0db5afb8a2b975e112099a8f2061e2a653c4b659ecb970277e4";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to secp, half", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const capacity = BigInt(500 * 10 ** 8);
  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.testnetAddress,
    capacity,
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

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cell_output.lock.args)
      .toArray(),
    [bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cell_output.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  const aliceReceiveCapacity: bigint = BigInt(
    txSkeleton.get("outputs").get(0)!.cell_output.capacity
  );

  t.is(aliceReceiveCapacity, capacity);

  t.is(txSkeleton.get("witnesses").size, 1);
  t.is(
    txSkeleton.get("witnesses").get(0),
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  );

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0xf03dfdd7457be6cd89784478334ae5f1ff3a404e6e3788b1f5457e41f418071b";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to secp, all", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const capacity = BigInt(1000 * 10 ** 8);
  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.testnetAddress,
    capacity,
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

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cell_output.lock.args)
      .toArray(),
    [bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cell_output.lock.args)
      .toArray(),
    [alice.blake160]
  );

  const aliceReceiveCapacity: bigint = BigInt(
    txSkeleton.get("outputs").get(0)!.cell_output.capacity
  );

  t.is(aliceReceiveCapacity, capacity);

  t.is(txSkeleton.get("witnesses").size, 1);
  t.is(
    txSkeleton.get("witnesses").get(0),
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  );

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0xef6bfd0d4b4514ae204aad0578db08de90a5ea66b390f802bd8d78b9aee1aa8e";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to secp, greater than capacity - minimal", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const bobCell = bobAcpCells[0]!;

  const capacity =
    BigInt(bobCell.cell_output.capacity) -
    minimalCellCapacity(bobCell) +
    BigInt(1);

  await t.throwsAsync(
    async () => {
      await anyoneCanPay.withdraw(
        txSkeleton,
        bobCell,
        alice.testnetAddress,
        capacity,
        { config: AGGRON4 }
      );
    },
    null,
    "capacity must be in [0, 93900000000] or 100000000000 !"
  );
});

test("setupInputCell", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });
  const inputCell: Cell = bobAcpCells[0];

  txSkeleton = await anyoneCanPay.setupInputCell(
    txSkeleton,
    inputCell,
    bob.testnetAddress,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  const input: Cell = txSkeleton.get("inputs").get(0)!;
  const output: Cell = txSkeleton.get("outputs").get(0)!;

  t.is(input.cell_output.capacity, output.cell_output.capacity);
  t.is(input.data, output.data);
  t.true(
    new values.ScriptValue(input.cell_output.lock, { validate: false }).equals(
      new values.ScriptValue(output.cell_output.lock, { validate: false })
    )
  );
  t.true(
    (!input.cell_output.type && !output.cell_output.type) ||
      new values.ScriptValue(input.cell_output.type!, {
        validate: false,
      }).equals(
        new values.ScriptValue(output.cell_output.type!, { validate: false })
      )
  );
});
