import test from "ava";
import { LockArgsCodec, AUTH_FLAG, OMNILOCK_FLAG } from "../src/args";

test("args#LockArgsCodec#Authentication", (t) => {
  (Object.keys(AUTH_FLAG) as (keyof typeof AUTH_FLAG)[]).forEach((flag) => {
    const args = LockArgsCodec.pack({
      authFlag: flag,
      authContent: "0x1234567812345678123456781234567812345678",
      omnilockFlags: {
        ADMINISTRATOR: false,
        ANYONE_CAN_PAY: false,
        TIME_LOCK: false,
        SUPPLY: false,
      },
      omnilockArgs: {},
    });

    t.deepEqual(args[0], AUTH_FLAG[flag]);
  });
});

test("args#LockArgsCodec#Administrator", (t) => {
  // normal case
  const args = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: true,
      ANYONE_CAN_PAY: false,
      TIME_LOCK: false,
      SUPPLY: false,
    },
    omnilockArgs: {
      rcCellTypeId:
        "0x1234567812345678123456781234567812345678123456781234567812345678",
    },
  });
  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags> <32 byte RC cell type ID, optional>
  t.deepEqual(args.length, 1 + 20 + 1 + 32);
  t.deepEqual(args[21], OMNILOCK_FLAG.ADMINISTRATOR);

  // args option case
  const optionArgs = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: true,
      ANYONE_CAN_PAY: false,
      TIME_LOCK: false,
      SUPPLY: false,
    },
    omnilockArgs: {},
  });
  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags>
  t.deepEqual(optionArgs.length, 1 + 20 + 1);

  // args error case
  const error = t.throws(
    () => {
      LockArgsCodec.pack({
        authFlag: "ETHEREUM",
        authContent: "0x1234567812345678123456781234567812345678",
        omnilockFlags: {
          ADMINISTRATOR: true,
          ANYONE_CAN_PAY: false,
          TIME_LOCK: false,
          SUPPLY: false,
        },
        omnilockArgs: {
          rcCellTypeId: "0x1234",
        },
      });
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Invalid buffer length: 2, should be 32");
});

test("args#LockArgsCodec#ACP", (t) => {
  const args = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: false,
      ANYONE_CAN_PAY: true,
      TIME_LOCK: false,
      SUPPLY: false,
    },
    omnilockArgs: {
      minimalACPPower: { ckb: 1, udt: 1 },
    },
  });
  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags> <2 bytes minimum ckb/udt in ACP, optional>
  t.deepEqual(args.length, 1 + 20 + 1 + 2);
  t.deepEqual(args[21], OMNILOCK_FLAG.ANYONE_CAN_PAY);

  // option case
  const optionArgs = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: false,
      ANYONE_CAN_PAY: true,
      TIME_LOCK: false,
      SUPPLY: false,
    },
    omnilockArgs: {},
  });

  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags>
  t.deepEqual(optionArgs.length, 1 + 20 + 1);
});

test("args#LockArgsCodec#TimeLock", (t) => {
  const args = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: false,
      ANYONE_CAN_PAY: false,
      TIME_LOCK: true,
      SUPPLY: false,
    },
    omnilockArgs: {
      timeLockSince: "0x1234567812345678",
    },
  });

  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags> <8 bytes since for time lock, optional>
  t.deepEqual(args.length, 1 + 20 + 1 + 8);
  t.deepEqual(args[21], OMNILOCK_FLAG.TIME_LOCK);

  // args error case
  const error = t.throws(
    () => {
      LockArgsCodec.pack({
        authFlag: "ETHEREUM",
        authContent: "0x1234567812345678123456781234567812345678",
        omnilockFlags: {
          ADMINISTRATOR: false,
          ANYONE_CAN_PAY: false,
          TIME_LOCK: true,
          SUPPLY: false,
        },
        omnilockArgs: {
          timeLockSince: "0x1234",
        },
      });
    },
    { instanceOf: Error }
  );
  t.is(error.message, "Invalid buffer length: 2, should be 8");
});

test("args#LockArgsCodec#Supply", (t) => {
  const args = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: false,
      ANYONE_CAN_PAY: false,
      TIME_LOCK: false,
      SUPPLY: true,
    },
    omnilockArgs: {
      supplyScriptHash:
        "0x1234567812345678123456781234567812345678123456781234567812345678",
    },
  });

  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags> <32 bytes type script hash for supply, optional>
  t.deepEqual(args.length, 1 + 20 + 1 + 32);
  t.deepEqual(args[21], OMNILOCK_FLAG.SUPPLY);

  // args error case
  const error = t.throws(
    () => {
      LockArgsCodec.pack({
        authFlag: "ETHEREUM",
        authContent: "0x1234567812345678123456781234567812345678",
        omnilockFlags: {
          ADMINISTRATOR: false,
          ANYONE_CAN_PAY: false,
          TIME_LOCK: false,
          SUPPLY: true,
        },
        omnilockArgs: {
          supplyScriptHash: "0x1234",
        },
      });
    },
    { instanceOf: Error }
  );

  t.is(error.message, "Invalid buffer length: 2, should be 32");
});

test("args#LockArgsCodec#MultipleMode", (t) => {
  // normal case
  const args = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: true,
      ANYONE_CAN_PAY: true,
      TIME_LOCK: true,
      SUPPLY: true,
    },
    omnilockArgs: {
      rcCellTypeId:
        "0x1234567812345678123456781234567812345678123456781234567812345678",
      minimalACPPower: { ckb: 1, udt: 1 },
      timeLockSince: "0x1234567812345678",
      supplyScriptHash:
        "0x1234567812345678123456781234567812345678123456781234567812345678",
    },
  });

  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags> <32 byte RC cell type ID, optional> <2 bytes minimum ckb/udt in ACP, optional> <8 bytes since for time lock, optional> <32 bytes type script hash for supply, optional>
  t.deepEqual(args.length, 1 + 20 + 1 + 32 + 2 + 8 + 32);
  t.deepEqual(
    args[21],
    OMNILOCK_FLAG.ADMINISTRATOR |
      OMNILOCK_FLAG.ANYONE_CAN_PAY |
      OMNILOCK_FLAG.SUPPLY |
      OMNILOCK_FLAG.TIME_LOCK
  );

  // option case
  const optionArgs = LockArgsCodec.pack({
    authFlag: "ETHEREUM",
    authContent: "0x1234567812345678123456781234567812345678",
    omnilockFlags: {
      ADMINISTRATOR: true,
      ANYONE_CAN_PAY: true,
      TIME_LOCK: true,
      SUPPLY: true,
    },
    omnilockArgs: {},
  });

  // <1 byte flag> <20 bytes auth content> <1 byte Omnilock flags>
  t.deepEqual(optionArgs.length, 1 + 20 + 1);
});
