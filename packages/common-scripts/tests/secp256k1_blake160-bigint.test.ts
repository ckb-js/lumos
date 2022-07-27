import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { secp256k1Blake160 } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { LINA } = predefined;
import { bob, alice, fullAddressInfo } from "./account_info";
import { inputs } from "./secp256k1_blake160_inputs";

const cellProvider = new CellProvider(inputs());
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

test("BigInt:transfer success", async (t) => {
  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity, sumOfInputCapacity);
});

test("BigInt:transfer to non secp256k1_blake160 address", async (t) => {
  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    fullAddressInfo.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity, sumOfInputCapacity);

  t.is(txSkeleton.get("outputs").size, 2);
  const targetOutput = txSkeleton.get("outputs").get(0)!;
  t.deepEqual(targetOutput.cellOutput!.lock, fullAddressInfo.lock);
  const changeOutput = txSkeleton.get("outputs").get(1)!;
  const template = LINA.SCRIPTS.SECP256K1_BLAKE160!;
  const expectedChangeLockScript = {
    codeHash: template.CODE_HASH,
    hashType: template.HASH_TYPE,
    args: bob.blake160,
  };
  t.deepEqual(changeOutput.cellOutput!.lock, expectedChangeLockScript);
});

test("BigInt:payFee", async (t) => {
  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  const fee = BigInt(1 * 10 ** 8);
  txSkeleton = await secp256k1Blake160.payFee(
    txSkeleton,
    bob.mainnetAddress,
    fee
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity + fee, sumOfInputCapacity);

  t.is(txSkeleton.get("inputs").size, 1);
});

test("BigInt:prepareSigningEntries", async (t) => {
  const expectedMessage =
    "0xd90a4204aee91348bf2ada132065a9a7aa4479001ec61e046c54804987b309ce";

  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  const fee = BigInt(1 * 10 ** 8);
  txSkeleton = await secp256k1Blake160.payFee(
    txSkeleton,
    bob.mainnetAddress,
    fee
  );

  txSkeleton = await secp256k1Blake160.prepareSigningEntries(txSkeleton);

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity + fee, sumOfInputCapacity);

  t.is(txSkeleton.get("inputs").size, 1);

  const message = txSkeleton.get("signingEntries").get(0)!.message;
  t.is(message, expectedMessage);
});

test("BigInt:transfer, skip duplicated input", async (t) => {
  const firstInput = inputs()[0];
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(firstInput);
  });
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cellOutput: firstInput.cellOutput,
      data: "0x",
      outPoint: undefined,
      blockHash: undefined,
    });
  });
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: 0,
    });
  });

  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cellOutput.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity, sumOfInputCapacity);

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);
  t.notDeepEqual(
    txSkeleton.get("inputs").get(0)!.outPoint,
    txSkeleton.get("inputs").get(1)!.outPoint
  );
});
