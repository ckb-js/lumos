import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { secp256k1Blake160Multisig } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { AGGRON4 } = predefined;
import { bobMultisigInputs } from "./inputs";
import { bob, alice } from "./account_info";

const cellProvider = new CellProvider(bobMultisigInputs);
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

test("BigInt:transfer success", async (t) => {
  txSkeleton = await secp256k1Blake160Multisig.transfer(
    txSkeleton,
    bob.fromInfo,
    alice.testnetAddress,
    BigInt(500 * 10 ** 8),
    {
      config: AGGRON4,
    }
  );

  txSkeleton = secp256k1Blake160Multisig.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

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

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0x692b35a7f06b5a0d80d6f4b393ae2da0176f4c04883fdc322e4b8861ea88121c";
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  t.is(message, expectedMessage);
  const expectedWitness =
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  t.is(txSkeleton.get("witnesses").size, 1);
  const witness = txSkeleton.get("witnesses").get(0)!;
  t.is(witness, expectedWitness);
});
