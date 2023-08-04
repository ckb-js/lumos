import test from "ava";
import { sudt, common } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
  parseAddress,
} from "@ckb-lumos/helpers";
import { bob, alice } from "./account_info";
import { predefined } from "@ckb-lumos/config-manager";
import { Script } from "@ckb-lumos/base";
import { isSudtScript } from "../src/helper";
import {
  bobSecpInputs,
  bobSecpSudtInputs,
  bobMultisigLockSudtInputs,
  tipHeader,
  bobAcpSudtInputs,
  aliceAcpSudtInputs,
} from "./inputs";
import { BI } from "@ckb-lumos/bi";
import { bytes, number } from "@ckb-lumos/codec";
import { packAmount, unpackAmount } from "../src/sudt";
const { AGGRON4 } = predefined;

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("issueToken", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(10000);
  txSkeleton = await sudt.issueToken(
    txSkeleton,
    bob.testnetAddress,
    BI.from(amount),
    undefined,
    undefined,
    {
      config: AGGRON4,
    }
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

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.true(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).eq(amount)
  );
  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
  );
});

test("transfer secp", async (t) => {
  const cellProvider = new CellProvider(bobSecpSudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bob.secpLockHash,
    alice.testnetAddress,
    BI.from(amount),
    bob.testnetAddress,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    amount.toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
  );
});

test("transfer locktime pool multisig & secp", async (t) => {
  const cellProvider = new CellProvider([bobSecpInputs[0]]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const since = "0x0";
  const amount = BI.from(10000);

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
    BI.from(amount),
    bob.testnetAddress,
    undefined,
    tipHeader,
    { config: AGGRON4, LocktimePoolCellCollector }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 3);
  t.is(txSkeleton.get("headerDeps").size, 0);
  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  const targetOutput = txSkeleton.get("outputs").get(0)!;
  const changeOutput = txSkeleton.get("outputs").get(1)!;
  t.is(
    number.Uint128LE.unpack(targetOutput!.data).toString(),
    amount.toString()
  );
  t.true(isSudtScript(targetOutput.cellOutput.type!, AGGRON4));
  t.is(changeOutput!.data, "0x");
  t.is(changeOutput.cellOutput.type, undefined);

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
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

  const amount = BI.from(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.acpTestnetAddress],
    bob.secpLockHash,
    alice.acpTestnetAddress,
    BI.from(amount),
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
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    amount.add(number.Uint128LE.unpack(aliceAcpSudtInputs[0].data)).toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
  );

  const expectedMessage =
    "0xd35ffba0a67f0637dab904f9940b3080d2ba9d65bf68a028756438c767251eb4";
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

  const amount = BI.from(10000);
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
    BI.from(amount),
    bob.acpTestnetAddress,
    BI.from(BI.from(1000 * 10 ** 8)),
    undefined,
    { config: AGGRON4 }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    amount.toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
  );

  const expectedMessage =
    "0xf8000f721af269f64f46c41ba0666a20957e9a70fad54e8badeeb6027dc351ad";
  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("transfer secp => secp, change to acp and has previous output, fixed", async (t) => {
  const cellProvider = new CellProvider(bobSecpSudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const firstBobSecpInput = bobSecpInputs[0];

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(firstBobSecpInput);
  });

  const sudtTypeScript: Script = {
    codeHash: AGGRON4.SCRIPTS.SUDT!.CODE_HASH,
    hashType: AGGRON4.SCRIPTS.SUDT!.HASH_TYPE,
    args: bob.secpLockHash,
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cellOutput: {
        capacity: firstBobSecpInput.cellOutput.capacity,
        lock: parseAddress(bob.acpTestnetAddress, { config: AGGRON4 }),
        type: sudtTypeScript,
      },
      data: bytes.hexify(number.Uint128LE.pack(0)),
    });
  });

  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "output",
      index: 0,
    });
  });

  const amount = BI.from(2000);
  const capacity = BI.from(200 * 10 ** 8);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bob.secpLockHash,
    alice.testnetAddress,
    BI.from(amount),
    bob.acpTestnetAddress,
    BI.from(capacity),
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    BI.from(0).toString()
  );
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(1)!.data).toString(),
    amount.toString()
  );
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(2)!.data).toString(),
    BI.from(10000).sub(amount).toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(1)!.cellOutput.type, AGGRON4)
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);
  t.is(txSkeleton.get("fixedEntries").size, 3);

  const lastOutput = txSkeleton.get("outputs").get(-1)!;
  t.true(isSudtScript(lastOutput.cellOutput.type, AGGRON4));
});

test("transfer secp, split change cell", async (t) => {
  const cellProvider = new CellProvider(bobSecpSudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(2000);
  const capacity = BI.from((1000 - 142 - 61) * 10 ** 8);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bob.secpLockHash,
    alice.testnetAddress,
    BI.from(amount),
    bob.testnetAddress,
    BI.from(capacity),
    undefined,
    { config: AGGRON4, splitChangeCell: true }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    amount.toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 3);
  t.is(txSkeleton.get("fixedEntries").size, 2);

  const lastOutput = txSkeleton.get("outputs").get(-1)!;
  t.is(lastOutput.cellOutput.type, undefined);
});

test("transfer secp, split change cell, not enough for two minimals", async (t) => {
  const cellProvider = new CellProvider(bobSecpSudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(2000);
  const capacity = BI.from((1000 - 142 - 61 + 1) * 10 ** 8);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bob.secpLockHash,
    alice.testnetAddress,
    BI.from(amount),
    bob.testnetAddress,
    BI.from(capacity),
    undefined,
    { config: AGGRON4, splitChangeCell: true }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    amount.toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cellOutput.type, AGGRON4)
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(txSkeleton.get("fixedEntries").size, 2);

  const lastOutput = txSkeleton.get("outputs").get(-1)!;
  t.not(lastOutput.cellOutput.type, undefined);
});

test("transfer secp => secp, change to acp and has previous output, split change cell", async (t) => {
  const cellProvider = new CellProvider(bobSecpSudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const firstBobSecpInput = bobSecpInputs[0];

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(firstBobSecpInput);
  });

  const sudtTypeScript: Script = {
    codeHash: AGGRON4.SCRIPTS.SUDT!.CODE_HASH,
    hashType: AGGRON4.SCRIPTS.SUDT!.HASH_TYPE,
    args: bob.secpLockHash,
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cellOutput: {
        capacity: firstBobSecpInput.cellOutput.capacity,
        lock: parseAddress(bob.acpTestnetAddress, { config: AGGRON4 }),
        type: sudtTypeScript,
      },
      data: bytes.hexify(number.Uint128LE.pack(0)),
    });
  });

  const amount = BI.from(2000);
  const capacity = BI.from((1000 - 142 - 61) * 10 ** 8);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bob.secpLockHash,
    alice.testnetAddress,
    BI.from(amount),
    bob.acpTestnetAddress,
    BI.from(capacity),
    undefined,
    { config: AGGRON4, splitChangeCell: true }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BI.from(o.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  const sumOfInputAmount = txSkeleton
    .get("inputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputAmount = txSkeleton
    .get("outputs")
    .filter((i) => i.cellOutput.type)
    .map((i) => number.Uint128LE.unpack(i.data))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputAmount.toString(), sumOfOutputAmount.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(0)!.data).toString(),
    BI.from(10000).sub(amount).toString()
  );
  t.is(
    number.Uint128LE.unpack(txSkeleton.get("outputs").get(1)!.data).toString(),
    amount.toString()
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(1)!.cellOutput.type, AGGRON4)
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);
  t.is(txSkeleton.get("fixedEntries").size, 1);

  const lastOutput = txSkeleton.get("outputs").get(-1)!;
  t.is(lastOutput.cellOutput.type, undefined);
});

test("pack and unpack sudt amount", (t) => {
  const unpacked = BI.from(0x1234);
  const packed = Buffer.alloc(16);
  // little endian of 0x1234
  packed.write("3412", "hex");

  t.true(bytes.equal(packAmount(unpacked), packed));
  t.true(unpackAmount(packed).eq(unpacked));

  const over16Bytes = bytes.concat(packed, packed);
  t.true(over16Bytes.length > 16);
  t.true(unpackAmount(over16Bytes).eq(unpacked));
});
