import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  parseAddress,
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { secp256k1Blake160Multisig } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { AGGRON4 } = predefined;
import { Cell, JSBI, values } from "@ckb-lumos/base";
import { bobMultisigInputs } from "./inputs";
import { bob, alice } from "./account_info";

const cellProvider = new CellProvider(bobMultisigInputs);
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

test("setupInputCell", async (t) => {
  const inputCell: Cell = bobMultisigInputs[0];

  txSkeleton = await secp256k1Blake160Multisig.setupInputCell(
    txSkeleton,
    inputCell,
    bob.fromInfo,
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

test("transfer success", async (t) => {
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

test("JSBI:transfer success", async (t) => {
  txSkeleton = await secp256k1Blake160Multisig.transferCompatible(
    txSkeleton,
    bob.fromInfo,
    alice.testnetAddress,
    JSBI.BigInt(500 * 10 ** 8),
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
    .map((i) => JSBI.BigInt(i.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => JSBI.BigInt(o.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

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

test("injectCapacity", async (t) => {
  const amount = BigInt(500 * 10 ** 8);
  const output: Cell = {
    cell_output: {
      capacity: "0x" + amount.toString(16),
      lock: parseAddress(alice.testnetAddress, { config: AGGRON4 }),
      type: undefined,
    },
    data: "0x",
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  txSkeleton = await secp256k1Blake160Multisig.injectCapacity(
    txSkeleton,
    0,
    bob.fromInfo,
    { config: AGGRON4 }
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

test("setupInputCell, require fromInfo", async (t) => {
  const inputCell: Cell = bobMultisigInputs[0];

  await t.throwsAsync(async () => {
    await secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      inputCell,
      undefined,
      {
        config: AGGRON4,
      }
    );
  });
});
