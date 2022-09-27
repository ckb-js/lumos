import test from "ava";
import { anyoneCanPay } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
  minimalCellCapacityCompatible,
} from "@ckb-lumos/helpers";
import { predefined } from "@ckb-lumos/config-manager";
import { bob, alice } from "./account_info";
import { bobAcpCells, aliceAcpCells } from "./inputs";
import { Cell, values, blockchain, Script } from "@ckb-lumos/base";
const { AGGRON4 } = predefined;
import { checkLimit, prepareSigningEntries } from "../src/anyone_can_pay";
import { BI } from "@ckb-lumos/bi";
import { hexify } from "@ckb-lumos/codec/lib/bytes";
import { SECP_SIGNATURE_PLACEHOLDER } from "../src/helper";

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});
test("withdraw, acp to acp, all", async (t) => {
  const cellProvider = new CellProvider([bobAcpCells[0], aliceAcpCells[0]]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.acpTestnetAddress,
    BI.from(BI.from(1000 * 10 ** 8)),
    { config: AGGRON4 }
  );

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(
    txSkeleton.get("cellDeps").get(0)!.outPoint.txHash,
    AGGRON4.SCRIPTS.ANYONE_CAN_PAY!.TX_HASH
  );

  t.is(txSkeleton.get("headerDeps").size, 0);

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 1);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cellOutput.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cellOutput.lock.args)
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
    "0xf862243671a339a33e5843877e88e640f848b6f2394a3995bc00b44bf9d19d4e";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to acp, half", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const capacity = BI.from(500 * 10 ** 8);
  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.acpTestnetAddress,
    BI.from(capacity),
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
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(
    txSkeleton.get("cellDeps").get(0)!.outPoint.txHash,
    AGGRON4.SCRIPTS.ANYONE_CAN_PAY!.TX_HASH
  );

  t.is(txSkeleton.get("headerDeps").size, 0);

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cellOutput.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cellOutput.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  const aliceReceiveCapacity: BI = BI.from(
    txSkeleton.get("outputs").get(0)!.cellOutput.capacity
  ).sub(BI.from(txSkeleton.get("inputs").get(0)!.cellOutput.capacity));

  t.is(aliceReceiveCapacity.toString(), capacity.toString());

  t.is(txSkeleton.get("witnesses").size, 2);
  t.is(txSkeleton.get("witnesses").get(0), "0x");

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0x5acf7d234fc5c9adbc9b01f4938a5efdf6efde2b0a836f4740e6a79f81b64d65";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to secp, half", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const capacity = BI.from(500 * 10 ** 8);
  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.testnetAddress,
    BI.from(capacity),
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
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(
    txSkeleton.get("cellDeps").get(0)!.outPoint.txHash,
    AGGRON4.SCRIPTS.ANYONE_CAN_PAY!.TX_HASH
  );

  t.is(txSkeleton.get("headerDeps").size, 0);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cellOutput.lock.args)
      .toArray(),
    [bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cellOutput.lock.args)
      .toArray(),
    [alice.blake160, bob.blake160]
  );

  const aliceReceiveCapacity: BI = BI.from(
    txSkeleton.get("outputs").get(0)!.cellOutput.capacity
  );

  t.is(aliceReceiveCapacity.toString(), capacity.toString());

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
    "0x554307c4b5858beed7c655b3b7a5537492f532a99ef419df59c94ac7f9347e8e";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to secp, all", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const capacity = BI.from(1000 * 10 ** 8);
  txSkeleton = await anyoneCanPay.withdraw(
    txSkeleton,
    bobAcpCells[0],
    alice.testnetAddress,
    BI.from(capacity),
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
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));
  t.is(sumOfOutputCapacity.toString(), sumOfInputCapacity.toString());

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(
    txSkeleton.get("cellDeps").get(0)!.outPoint.txHash,
    AGGRON4.SCRIPTS.ANYONE_CAN_PAY!.TX_HASH
  );

  t.is(txSkeleton.get("headerDeps").size, 0);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);

  t.deepEqual(
    txSkeleton
      .get("inputs")
      .map((i) => i.cellOutput.lock.args)
      .toArray(),
    [bob.blake160]
  );

  t.deepEqual(
    txSkeleton
      .get("outputs")
      .map((o) => o.cellOutput.lock.args)
      .toArray(),
    [alice.blake160]
  );

  const aliceReceiveCapacity: BI = BI.from(
    txSkeleton.get("outputs").get(0)!.cellOutput.capacity
  );

  t.is(aliceReceiveCapacity.toString(), capacity.toString());

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
    "0x1cb8e323da40058080ddd386ab0f6e62b793abacf68fd3da835273dd0e278c25";

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("withdraw, acp to secp, greater than capacity - minimal", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const bobCell = bobAcpCells[0]!;

  const capacity = BI.from(bobCell.cellOutput.capacity)
    .sub(minimalCellCapacityCompatible(bobCell))
    .add(1);

  await t.throwsAsync(
    async () => {
      await anyoneCanPay.withdraw(
        txSkeleton,
        bobCell,
        alice.testnetAddress,
        BI.from(capacity),
        {
          config: AGGRON4,
        }
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

test("checkLimit, amount and capacity", (t) => {
  const args = bob.blake160 + "01" + "02";
  t.throws(() => checkLimit(args, BI.from(BI.from(0))));
  t.throws(() => checkLimit(args, BI.from(BI.from(10 * 10 ** 8 - 1))));
  t.notThrows(() => checkLimit(args, BI.from(BI.from(10 * 10 ** 8))));
});

test("checkLimit, only capacity", (t) => {
  const args = bob.blake160 + "01";
  t.throws(() => checkLimit(args, BI.from(BI.from(0))));
  t.throws(() => checkLimit(args, BI.from(BI.from(10 * 10 ** 8 - 1))));
  t.notThrows(() => checkLimit(args, BI.from(BI.from(10 * 10 ** 8))));
});

test("checkLimit, no limit", (t) => {
  const args = bob.blake160;
  t.notThrows(() => checkLimit(args, BI.from(BI.from(0))));
});

const emptyWitness = hexify(
  blockchain.WitnessArgs.pack({ lock: SECP_SIGNATURE_PLACEHOLDER })
);

test("hashContentExceptRawTx in return value of `prepareSigningEntries` should be correct", (t) => {
  const lockScript: Script = {
    codeHash: AGGRON4.SCRIPTS.ANYONE_CAN_PAY.CODE_HASH,
    hashType: AGGRON4.SCRIPTS.ANYONE_CAN_PAY.HASH_TYPE,
    args: "0x",
  };
  let txSkeleton = TransactionSkeleton()
    .update("inputs", (inputs) => {
      return inputs.push(
        {
          cellOutput: {
            capacity: "0x114514",
            lock: lockScript,
            type: undefined,
          },
          data: "0x",
          outPoint: {
            txHash:
              "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            index: "0x0",
          },
        },
        {
          cellOutput: {
            capacity: "0x191981",
            lock: lockScript,
            type: undefined,
          },
          data: "0x",
          outPoint: {
            txHash:
              "0xf8de3bb47d055cdf460d93a2a6e1b05f7432f9777c8c474abf4eec1d4aee5d37",
            index: "0x0",
          },
        }
      );
    })
    .update("outputs", (outputs) => {
      return outputs.push({
        cellOutput: {
          capacity: "0x114514",
          lock: lockScript,
          type: undefined,
        },

        data: "0x",
      });
    })
    .update("witnesses", (witnesses) =>
      witnesses.push(
        emptyWitness,
        emptyWitness,
        hexify(
          blockchain.WitnessArgs.pack({
            lock: SECP_SIGNATURE_PLACEHOLDER,
            inputType: "0xAADD",
            outputType: "0xDDDD",
          })
        )
      )
    );

  const tx = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.is(
    hexify(tx.signingEntries.get(0)!.hashContentExceptRawTx),
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000550000001000000055000000550000004100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006100000010000000550000005b00000041000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000aadd02000000dddd"
  );
});
