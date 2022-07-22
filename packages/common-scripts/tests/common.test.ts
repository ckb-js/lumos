import test from "ava";
import common, {
  transfer,
  prepareSigningEntries,
  registerCustomLockScriptInfos,
  setupInputCell,
  payFeeByFeeRate,
  payFee,
  injectCapacity,
} from "../src/common";
const { __tests__ } = common;
import { CellProvider } from "./cell_provider";
import {
  parseAddress,
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import {
  Cell,
  Transaction,
  values,
  Script,
  CellCollector as BaseCellCollector,
} from "@ckb-lumos/base";
import { anyoneCanPay, parseFromInfo } from "../src";
import { Config, predefined } from "@ckb-lumos/config-manager";
import { CellCollector } from "../src/locktime_pool";
const { AGGRON4, LINA } = predefined;

import {
  bobSecpInputs,
  bobMultisigInputs,
  bobMultisigLockInputs,
  tipHeader,
  bobAcpCells,
  aliceAcpCells,
} from "./inputs";
import { bob, alice } from "./account_info";
import { List } from "immutable";
import { BI } from "@ckb-lumos/bi";
import { CellCollectorConstructor } from "../src/type";

const aliceAddress = "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v";

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("transfer, acp => acp", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(500 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.acpTestnetAddress],
    alice.acpTestnetAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("witnesses").size, 2);

  t.is(txSkeleton.get("witnesses").get(0)!, "0x");

  const expectedMessage =
    "0x5acf7d234fc5c9adbc9b01f4938a5efdf6efde2b0a836f4740e6a79f81b64d65";

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.is(txSkeleton.get("signingEntries").size, 1);

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("lockScriptInfos", (t) => {
  __tests__.resetLockScriptInfos();
  t.is(__tests__.getLockScriptInfos().infos.length, 0);
  registerCustomLockScriptInfos([
    {
      codeHash: "",
      hashType: "type",
      lockScriptInfo: anyoneCanPay,
    },
  ]);
  t.is(__tests__.getLockScriptInfos().infos.length, 1);

  __tests__.resetLockScriptInfos();
  t.is(__tests__.getLockScriptInfos().infos.length, 0);
  __tests__.generateLockScriptInfos({ config: AGGRON4 });
  t.is(__tests__.getLockScriptInfos().infos.length, 3);
  const configCodeHash = __tests__.getLockScriptInfos().configHashCode;
  t.not(configCodeHash, 0);

  // run again, won't change
  __tests__.generateLockScriptInfos({ config: AGGRON4 });
  t.is(__tests__.getLockScriptInfos().infos.length, 3);
  t.is(__tests__.getLockScriptInfos().configHashCode, configCodeHash);

  // using LINA
  __tests__.generateLockScriptInfos({ config: LINA });
  t.is(__tests__.getLockScriptInfos().infos.length, 3);
  t.not(__tests__.getLockScriptInfos().configHashCode, configCodeHash);
});

test("transfer secp => secp", async (t) => {
  const cellProvider = new CellProvider([...bobSecpInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );

  t.is(txSkeleton.get("witnesses").size, 1);

  const expectedMessages = [
    "0x997f7d53307a114104b37c0fcdef97240d250d468189e71632d79e1c3b20a4f9",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("transfer secp & multisig => secp", async (t) => {
  const cellProvider = new CellProvider([
    bobSecpInputs[0],
    ...bobMultisigInputs,
  ]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(1500 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress, bob.fromInfo],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );

  t.is(txSkeleton.get("witnesses").size, 2);

  const expectedMessages = [
    "0x45e7955cbc1ae0f8c2fbb3392a3afcea9ae1ae83c48e4355f131d751325ea615",
    "0x051a18a11dacfd6573a689328ea7ee0cc3f2533de9c15e4f9e12f0e4a6e9691c",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("transfer multisig lock => secp", async (t) => {
  const cellProvider = new CellProvider([...bobMultisigLockInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });
  const LocktimePoolCellCollector: CellCollectorConstructor = class LocktimePoolCellCollector
    implements BaseCellCollector {
    readonly fromScript: Script;
    constructor() {
      this.fromScript = {
        codeHash: "",
        hashType: "data",
        args: "",
      };
    }
    async *collect() {
      yield {
        ...bobMultisigLockInputs[0],
        since: "0x0",
        depositBlockHash: undefined,
        withdrawBlockHash: undefined,
        sinceBaseValue: undefined,
      };
    }
  };

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.fromInfo],
    alice.testnetAddress,
    BI.from(amount),
    undefined,
    tipHeader,
    {
      config: AGGRON4,
      LocktimePoolCellCollector: LocktimePoolCellCollector,
    }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );

  t.is(txSkeleton.get("witnesses").size, 1);

  const expectedMessages = [
    "0x54f766189f91dcf10a23833c5b1f0d318044c7237a2a703ad77ea46990190b8b",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("transfer secp => acp", async (t) => {
  const cellProvider = new CellProvider([...bobSecpInputs, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    alice.acpTestnetAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity)
      .sub(BI.from(aliceAcpCells[0]!.cellOutput.capacity))
      .toString(),
    amount.toString()
  );

  const expectedWitnesses = [
    "0x",
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  ];
  t.deepEqual(txSkeleton.get("witnesses").toJS(), expectedWitnesses);

  const expectedMessages = [
    "0x7449d526fa5fbaf942cbf29f833d89026b6f28322d0bd4725eb8c0b921b3b275",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("transfer secp => acp, no acp previous input", async (t) => {
  const cellProvider = new CellProvider([...bobSecpInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    alice.acpTestnetAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(txSkeleton.get("headerDeps").size, 0);
  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );

  const expectedWitnesses = [
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  ];
  t.deepEqual(txSkeleton.get("witnesses").toJS(), expectedWitnesses);

  const expectedMessages = [
    "0x68a543a1ef68667281609d9331f3587f4bfac16002f0fbac72e3774de80f45fb",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("transfer acp => secp, destroy", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(1000 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [
      {
        address: bob.acpTestnetAddress,
        destroyable: true,
      },
    ],
    bob.testnetAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.toString(), sumOfOutputCapcity.toString());

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );

  t.is(txSkeleton.get("witnesses").size, 1);

  const expectedMessages = [
    "0x3196d29d3365c1d3d599be55e80e4addd631acb6605646329eb39a1b9264ab89",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("Don't update capacity directly when deduct", async (t) => {
  const cellProvider = new CellProvider([bobSecpInputs[0]]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const getCapacities = (cells: List<Cell>): string[] => {
    return cells.map((c) => c.cellOutput.capacity).toJS();
  };

  const inputCapacitiesBefore = getCapacities(txSkeleton.get("inputs"));
  const outputCapacitiesBefore = getCapacities(txSkeleton.get("outputs"));

  let errFlag = false;
  try {
    await transfer(
      txSkeleton,
      [bob.testnetAddress],
      aliceAddress,
      BI.from(BI.from(500 * 10 ** 8)),
      undefined,
      undefined,
      { config: AGGRON4 }
    );
  } catch {
    errFlag = true;
  }

  const inputCapacitiesAfter = getCapacities(txSkeleton.get("inputs"));
  const outputCapacitiesAfter = getCapacities(txSkeleton.get("outputs"));

  t.true(errFlag);
  t.deepEqual(inputCapacitiesBefore, inputCapacitiesAfter);
  t.deepEqual(outputCapacitiesBefore, outputCapacitiesAfter);
});

test("setupInputCell secp", async (t) => {
  const cellProvider = new CellProvider([...bobSecpInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const inputCell: Cell = bobSecpInputs[0];

  txSkeleton = await setupInputCell(txSkeleton, inputCell, bob.testnetAddress, {
    config: AGGRON4,
  });

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

const testTx: Transaction = {
  version: "0x0",
  cellDeps: [
    {
      outPoint: {
        txHash:
          "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        index: "0x0",
      },
      depType: "dep_group",
    },
    {
      outPoint: {
        txHash:
          "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        index: "0x2",
      },
      depType: "code",
    },
  ],
  headerDeps: [],
  inputs: [
    {
      previousOutput: {
        txHash:
          "0x31f695263423a4b05045dd25ce6692bb55d7bba2965d8be16b036e138e72cc65",
        index: "0x1",
      },
      since: "0x0",
    },
  ],
  outputs: [
    {
      capacity: "0x174876e800",
      lock: {
        codeHash:
          "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hashType: "type",
      },
      type: {
        codeHash:
          "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        args: "0x",
        hashType: "data",
      },
    },
    {
      capacity: "0x59e1416a5000",
      lock: {
        codeHash:
          "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hashType: "type",
      },
      type: undefined,
    },
  ],
  outputsData: ["0x1234", "0x"],
  witnesses: [
    "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900",
  ],
};

test("getTransactionSizeByTx", (t) => {
  const size: number = __tests__.getTransactionSizeByTx(testTx);
  t.is(size, 536);
});

test("calculateFeeCompatible, without carry", (t) => {
  t.is(
    __tests__.calculateFeeCompatible(1035, BI.from(BI.from(1000))).toString(),
    BI.from(1035).toString()
  );
});

test("calculateFeeCompatible, with carry", (t) => {
  t.is(
    __tests__.calculateFeeCompatible(1035, BI.from(BI.from(900))).toString(),
    BI.from(932).toString()
  );
});

function getExpectedFee(txSkeleton: TransactionSkeletonType, feeRate: BI): BI {
  return BI.from(
    __tests__.calculateFeeCompatible(
      __tests__.getTransactionSize(txSkeleton),
      BI.from(feeRate)
    )
  );
}

function getFee(txSkeleton: TransactionSkeletonType): BI {
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  return sumOfInputCapacity.sub(sumOfOutputCapcity);
}

// from same address and only secp156k1_blake160 lock
// const ONE_IN_ONE_OUT_SIZE = 355
const ONE_IN_TWO_OUT_SIZE = 464;
// const TWO_IN_ONE_OUT_SIZE = 407
// const TWO_IN_TWO_OUT_SIZE = 516

test("payFeeByFeeRate 1 in 1 out, add 1 in 1 out", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(1000 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BI.from(1 * 10 ** 8 * 1000);
  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(feeRate),
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    getFee(txSkeleton).toString(),
    getExpectedFee(txSkeleton, feeRate).toString()
  );
});

test("payFeeByFeeRate 1 in 2 out, add nothing", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BI.from(1 * 10 ** 8);
  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(feeRate),
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    getFee(txSkeleton).toString(),
    getExpectedFee(txSkeleton, feeRate).toString()
  );
});

test("payFeeByFeeRate 1 in 2 out, reduce 1 out", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(536 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BI.from(1 * 10 ** 8 * 1000);
  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(feeRate),
    undefined,
    {
      config: AGGRON4,
    }
  );

  // NOTE: 1000CKB => 536CKB + 464CKB(change), need 464CKB for fee, so reduced change cell
  // But, new tx is 1000CKB => 536CKB, need 355CKB for fee
  // when you add a new change output, fee will up to 464CKB or even a new input, so left 1000CKB => 536CKB is best choice.
  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.is(
    getFee(txSkeleton).toString(),
    __tests__
      .calculateFeeCompatible(ONE_IN_TWO_OUT_SIZE, BI.from(feeRate))
      .toString()
  );
});

test("payFeeByFeeRate 1 in 2 out, add 1 in", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BI.from(1 * 10 ** 8 * 1000);
  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(feeRate),
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    getFee(txSkeleton).toString(),
    getExpectedFee(txSkeleton, feeRate).toString()
  );
});

test("payFeeByFeeRate, capacity 500", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(500 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BI.from(1000);
  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(feeRate),
    undefined,
    {
      config: AGGRON4,
    }
  );

  const expectedFee: BI = BI.from(464);

  t.is(getFee(txSkeleton).toString(), expectedFee.toString());
});

test("payFeeByFeeRate, capacity 1000", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(1000 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BI.from(1000);
  txSkeleton = await payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(feeRate),
    undefined,
    {
      config: AGGRON4,
    }
  );

  const expectedFee: BI = BI.from(516);

  t.is(getFee(txSkeleton).toString(), expectedFee.toString());
});

test("Should not throw if anyone-can-pay config not provided", async (t) => {
  // config without anyone-can-pay
  const config: Config = {
    PREFIX: AGGRON4.PREFIX,
    SCRIPTS: {
      SECP256K1_BLAKE160: AGGRON4.SCRIPTS.SECP256K1_BLAKE160,
      SECP256K1_BLAKE160_MULTISIG: AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG,
      DAO: AGGRON4.SCRIPTS.DAO,
    },
  };

  const cellProvider = new CellProvider([...bobSecpInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  await t.notThrowsAsync(async () => {
    await transfer(
      txSkeleton,
      [bob.testnetAddress],
      aliceAddress,
      BI.from(amount),
      undefined,
      undefined,
      { config }
    );
  });
});

// disable deduct capacity
test("transfer secp => secp, without deduct capacity", async (t) => {
  const cellProvider = new CellProvider([...bobSecpInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.testnetAddress],
    alice.testnetAddress,
    BI.from(amount),
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  t.is(txSkeleton.get("inputs").size, 1);

  t.is(txSkeleton.get("outputs").size, 2);

  const fee: BI = BI.from(1000);
  txSkeleton = await payFee(
    txSkeleton,
    [bob.testnetAddress],
    BI.from(fee),
    undefined,
    {
      config: AGGRON4,
      enableDeductCapacity: false,
    }
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.sub(sumOfOutputCapcity).toString(), fee.toString());

  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );
  t.is(
    BI.from(txSkeleton.get("outputs").get(1)!.cellOutput.capacity).toString(),
    BI.from(bobSecpInputs[0].cellOutput.capacity).sub(amount).toString()
  );
  t.is(
    BI.from(txSkeleton.get("outputs").get(2)!.cellOutput.capacity).toString(),
    BI.from(bobSecpInputs[1].cellOutput.capacity).sub(fee).toString()
  );

  const changeLockScript: Script = parseAddress(bob.testnetAddress, {
    config: AGGRON4,
  });

  t.true(
    new values.ScriptValue(txSkeleton.get("outputs").get(1)!.cellOutput.lock, {
      validate: false,
    }).equals(new values.ScriptValue(changeLockScript, { validate: false }))
  );
  t.true(
    new values.ScriptValue(txSkeleton.get("outputs").get(2)!.cellOutput.lock, {
      validate: false,
    }).equals(new values.ScriptValue(changeLockScript, { validate: false }))
  );
  t.is(txSkeleton.get("fixedEntries").size, 0);

  const expectedMessages = [
    "0x7bf7f9183d54e3a69d80c1d049d0b1cda7005341f428b70b22abc356286dbf70",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});

test("transfer multisig lock => secp, without deduct capacity", async (t) => {
  const cellProvider = new CellProvider([...bobMultisigInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });
  const LocktimePoolCellCollector: CellCollectorConstructor = class LocktimePoolCellCollector
    implements BaseCellCollector {
    readonly fromScript: Script;
    constructor() {
      this.fromScript = {
        codeHash: "",
        hashType: "data",
        args: "",
      };
    }
    async *collect() {
      for (const cell of bobMultisigInputs) {
        yield {
          ...cell,
          since: "0x0",
          depositBlockHash: undefined,
          withdrawBlockHash: undefined,
          sinceBaseValue: undefined,
        };
      }
    }
  };
  const amount = BI.from(600 * 10 ** 8);
  txSkeleton = await transfer(
    txSkeleton,
    [bob.fromInfo],
    alice.testnetAddress,
    BI.from(amount),
    undefined,
    tipHeader,
    {
      config: AGGRON4,
      LocktimePoolCellCollector: LocktimePoolCellCollector,
    }
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);

  const fee = BI.from(1000);
  txSkeleton = await injectCapacity(
    txSkeleton,
    [bob.fromInfo],
    BI.from(fee),
    undefined,
    tipHeader,
    {
      config: AGGRON4,
      LocktimePoolCellCollector: CellCollector,
      enableDeductCapacity: false,
    }
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((i) => BI.from(i.cellOutput.capacity))
    .reduce((result, c) => result.add(c), BI.from(0));

  t.is(sumOfInputCapacity.sub(sumOfOutputCapcity).toString(), fee.toString());

  t.is(
    BI.from(txSkeleton.get("outputs").get(0)!.cellOutput.capacity).toString(),
    amount.toString()
  );
  t.is(
    BI.from(txSkeleton.get("outputs").get(1)!.cellOutput.capacity).toString(),
    BI.from(bobMultisigInputs[0].cellOutput.capacity).sub(amount).toString()
  );
  t.is(
    BI.from(txSkeleton.get("outputs").get(2)!.cellOutput.capacity).toString(),
    BI.from(bobMultisigInputs[1].cellOutput.capacity).sub(fee).toString()
  );

  const changeLockScript: Script = parseFromInfo(bob.fromInfo, {
    config: AGGRON4,
  }).fromScript;
  t.true(
    new values.ScriptValue(txSkeleton.get("outputs").get(1)!.cellOutput.lock, {
      validate: false,
    }).equals(new values.ScriptValue(changeLockScript, { validate: false }))
  );
  t.true(
    new values.ScriptValue(txSkeleton.get("outputs").get(2)!.cellOutput.lock, {
      validate: false,
    }).equals(new values.ScriptValue(changeLockScript, { validate: false }))
  );
  t.is(txSkeleton.get("fixedEntries").size, 0);

  const expectedMessages = [
    "0x01fc08c48a5cab51686b808e65d041966a460a17cfa82bb77cbd270fff4634c0",
  ];

  txSkeleton = prepareSigningEntries(txSkeleton, { config: AGGRON4 });
  t.deepEqual(
    txSkeleton
      .get("signingEntries")
      .sort((a, b) => a.index - b.index)
      .map((s) => s.message)
      .toArray(),
    expectedMessages
  );
});
