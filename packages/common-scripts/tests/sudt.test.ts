import test from "ava";
import { sudt, common } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { bob, alice } from "./account_info";
import { predefined } from "@ckb-lumos/config-manager";
import { utils } from "@ckb-lumos/base";
import { isSudtScript } from "../src/helper";
import {
  bobSecpInputs,
  bobSecpSudtInputs,
  bobMultisigLockSudtInputs,
  tipHeader,
  bobAcpSudtInputs,
  aliceAcpSudtInputs,
} from "./inputs";
const { readBigUInt128LE } = utils;
const { AGGRON4 } = predefined;

test("issueToken", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.issueToken(
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

test("transfer secp", async (t) => {
  const cellProvider = new CellProvider(bobSecpSudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bob.secpLockHash,
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

test("transfer locktime pool multisig & secp", async (t) => {
  const cellProvider = new CellProvider([bobSecpInputs[0]]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const since = "0x0";
  const amount = BigInt(10000);

  class LocktimePoolCellCollector {
    constructor() {}

    async *collect() {
      yield bobMultisigLockSudtInputs[0];
    }
  }

  txSkeleton = await sudt.transfer(
    txSkeleton,
    [
      {
        ...bob.fromInfo,
        since,
      },
      bob.testnetAddress,
    ],
    bob.secpLockHash,
    alice.testnetAddress,
    amount,
    bob.testnetAddress,
    undefined,
    tipHeader,
    { config: AGGRON4, LocktimePoolCellCollector }
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

  t.is(txSkeleton.get("cellDeps").size, 3);
  t.is(txSkeleton.get("headerDeps").size, 0);
  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  const targetOutput = txSkeleton.get("outputs").get(0)!;
  const changeOutput = txSkeleton.get("outputs").get(1)!;
  t.is(readBigUInt128LE(targetOutput!.data), amount);
  t.true(isSudtScript(targetOutput.cell_output.type!, AGGRON4));
  t.is(changeOutput!.data, "0x");
  t.is(changeOutput.cell_output.type, undefined);

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cell_output.type, AGGRON4)
  );
});

test("ownerForSudt, by address", (t) => {
  const sudtToken = sudt.ownerForSudt(bob.testnetAddress, { config: AGGRON4 });

  t.is(sudtToken, bob.secpLockHash);
});

test("ownerForSudt, by MultisigScript", (t) => {
  const sudtToken = sudt.ownerForSudt(bob.fromInfo);

  const expectedToken =
    "0x52ac8ff1f0486783a5a6a30659715fcee67709c75172ff7b015910ced4586436";

  t.is(sudtToken, expectedToken);
});

test("transfer acp", async (t) => {
  const cellProvider = new CellProvider([
    ...bobAcpSudtInputs,
    ...aliceAcpSudtInputs,
  ]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.acpTestnetAddress],
    bob.secpLockHash,
    alice.acpTestnetAddress,
    amount,
    bob.acpTestnetAddress,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

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
  t.is(
    readBigUInt128LE(txSkeleton.get("outputs").get(0)!.data),
    amount + readBigUInt128LE(aliceAcpSudtInputs[0].data)
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cell_output.type, AGGRON4)
  );

  const expectedMessage =
    "0xaadf6f492ba070805dcba94b10b1f2b8323044babd3be02c5933e5738187d522";
  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("transfer acp => secp, destroyable", async (t) => {
  const cellProvider = new CellProvider([
    ...bobAcpSudtInputs,
    ...bobSecpInputs,
  ]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [
      {
        address: bob.acpTestnetAddress,
        destroyable: true,
      },
    ],
    bob.secpLockHash,
    alice.testnetAddress,
    amount,
    bob.acpTestnetAddress,
    BigInt(1000 * 10 ** 8),
    undefined,
    { config: AGGRON4 }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

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

  const expectedMessage =
    "0xc5f2edfcda349cd281f52e7338be22b96a30fccddb2670794f9a9268292ff742";
  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});
