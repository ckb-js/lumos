import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  parseAddress,
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { secp256k1Blake160 } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { LINA, AGGRON4 } = predefined;
import { bob, alice, fullAddressInfo } from "./account_info";
import { inputs } from "./secp256k1_blake160_inputs";
import { Cell, values } from "@ckb-lumos/base";
import { bobSecpInputs } from "./inputs";
import { BI } from "@ckb-lumos/bi";

const cellProvider = new CellProvider(inputs());
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("JSBI:transfer success", async (t) => {
  txSkeleton = await secp256k1Blake160.transferCompatible(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BI.from(BI.from(1000 * 10 ** 8))
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());
});

test("JSBI:transfer to non secp256k1_blake160 address", async (t) => {
  txSkeleton = await secp256k1Blake160.transferCompatible(
    txSkeleton,
    bob.mainnetAddress,
    fullAddressInfo.mainnetAddress,
    BI.from(BI.from(1000 * 10 ** 8))
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

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

test("JSBI:payFee", async (t) => {
  txSkeleton = await secp256k1Blake160.transferCompatible(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BI.from(BI.from(1000 * 10 ** 8))
  );

  const fee = BI.from(1 * 10 ** 8);
  txSkeleton = await secp256k1Blake160.payFee(
    txSkeleton,
    bob.mainnetAddress,
    BI.from(fee)
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.add(fee).toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("inputs").size, 1);
});

test("JSBI:prepareSigningEntries", async (t) => {
  const expectedMessage =
    "0xd90a4204aee91348bf2ada132065a9a7aa4479001ec61e046c54804987b309ce";

  txSkeleton = await secp256k1Blake160.transferCompatible(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BI.from(BI.from(1000 * 10 ** 8))
  );

  const fee = BI.from(1 * 10 ** 8);
  txSkeleton = await secp256k1Blake160.payFee(
    txSkeleton,
    bob.mainnetAddress,
    BI.from(fee)
  );

  txSkeleton = await secp256k1Blake160.prepareSigningEntries(txSkeleton);

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.add(fee).toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("inputs").size, 1);

  const message = txSkeleton.get("signingEntries").get(0)!.message;
  t.is(message, expectedMessage);
});

// TODO fix test, cause run test only success but failed while run all test
test.skip("JSBI:transferCompatible, skip duplicated input", async (t) => {
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

  txSkeleton = await secp256k1Blake160.transferCompatible(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BI.from(BI.from(1000 * 10 ** 8))
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);
  t.notDeepEqual(
    txSkeleton.get("inputs").get(0)!.outPoint,
    txSkeleton.get("inputs").get(1)!.outPoint
  );
});

test("setupInputCell", async (t) => {
  const inputCell: Cell = inputs()[0];
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await secp256k1Blake160.setupInputCell(
    txSkeleton,
    inputCell,
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  const input: Cell = txSkeleton.get("inputs").get(0)!;
  const output: Cell = txSkeleton.get("outputs").get(0)!;

  t.is(input.cellOutput.capacity, output.cellOutput.capacity);
  t.is(input.data, output.data);
  t.true(
    new values.ScriptValue(input.cellOutput.lock, { validate: false }).equals(
      new values.ScriptValue(output.cellOutput.lock, { validate: false })
    )
  );
  t.true(
    (!input.cellOutput.type && !output.cellOutput.type) ||
      new values.ScriptValue(input.cellOutput.type!, {
        validate: false,
      }).equals(
        new values.ScriptValue(output.cellOutput.type!, { validate: false })
      )
  );
});

test("injectCapacity", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton = TransactionSkeleton({ cellProvider });

  const amount = BI.from(500 * 10 ** 8);
  const output: Cell = {
    cellOutput: {
      capacity: "0x" + amount.toString(16),
      lock: parseAddress(alice.testnetAddress, { config: AGGRON4 }),
      type: undefined,
    },
    data: "0x",
  };
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push(output);
  });

  txSkeleton = await secp256k1Blake160.injectCapacity(
    txSkeleton,
    0,
    bob.testnetAddress,
    { config: AGGRON4 }
  );

  txSkeleton = secp256k1Blake160.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0xaeb7b9b819ae94b20bcb02abc7d156cfa771d71e8d8c136dc73f4e5de8d25bf2";
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  t.is(message, expectedMessage);

  t.is(txSkeleton.get("witnesses").size, 1);
  const expectedWitness =
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const witness = txSkeleton.get("witnesses").get(0)!;
  t.is(witness, expectedWitness);
});
