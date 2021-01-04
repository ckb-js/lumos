import test from "ava";
import common from "../src/common";
const { __tests__ } = common;
const { _commonTransfer } = __tests__;
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { Cell, Transaction, values } from "@ckb-lumos/base";
import { FromInfo, anyoneCanPay } from "../src";
import { Config, predefined } from "@ckb-lumos/config-manager";
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

const aliceInput: Cell = {
  cell_output: {
    capacity: "0x1d1a3543f00",
    lock: {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
    },
  },
  out_point: {
    tx_hash:
      "0x42300d78faea694e0e1c2316de091964a0d976a4ed27775597bad2d43a3e17da",
    index: "0x1",
  },
  block_hash:
    "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
  block_number: "0x1929c",
  data: "0x",
};

const multisigInput: Cell = {
  cell_output: {
    capacity: "0xba37cb7e00",
    lock: {
      code_hash:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      hash_type: "type",
      args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
    },
  },
  out_point: {
    tx_hash:
      "0xc0018c999d6e7d1f830ea645d980a3a9c3c3832d12e72172708ce8461fc5821e",
    index: "0x1",
  },
  block_hash:
    "0x29c8f7d773ccd74724f95f562d049182c2461dd7459ebfc494b7bb0857e8c902",
  block_number: "0x1aed9",
  data: "0x",
};

const cellProvider = new CellProvider([aliceInput].concat([multisigInput]));
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

const aliceAddress = "ckt1qyqwyxfa75whssgkq9ukkdd30d8c7txct0gqfvmy2v";

const fromInfo: FromInfo = {
  R: 0,
  M: 1,
  publicKeyHashes: ["0x36c329ed630d6ce750712a477543672adab57f4c"],
};

test("_commonTransfer, only alice", async (t) => {
  const amount: bigint = BigInt(20000 * 10 ** 8);
  const result = await _commonTransfer(
    txSkeleton,
    [aliceAddress],
    amount,
    BigInt(61 * 10 ** 8),
    { config: AGGRON4 }
  );
  txSkeleton = result.txSkeleton;

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 0);
  t.is(result.capacity, amount - BigInt(aliceInput.cell_output.capacity));
});

test("_commonTransfer, alice and fromInfo", async (t) => {
  const amount: bigint = BigInt(20000 * 10 ** 8);
  const result = await _commonTransfer(
    txSkeleton,
    [aliceAddress, fromInfo],
    amount,
    BigInt(61 * 10 ** 8),
    { config: AGGRON4 }
  );
  txSkeleton = result.txSkeleton;

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 0);
  t.is(result.capacity, BigInt(0));
  t.is(result.changeCapacity, inputCapacity - amount);
});

test("transfer, acp => acp", async (t) => {
  const cellProvider = new CellProvider([...bobAcpCells, ...aliceAcpCells]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(500 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.acpTestnetAddress],
    alice.acpTestnetAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("witnesses").size, 2);

  t.is(txSkeleton.get("witnesses").get(0)!, "0x");

  const expectedMessage =
    "0x5acf7d234fc5c9adbc9b01f4938a5efdf6efde2b0a836f4740e6a79f81b64d65";

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.is(txSkeleton.get("signingEntries").size, 1);

  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});

test("lockScriptInfos", (t) => {
  common.__tests__.resetLockScriptInfos();
  t.is(common.__tests__.getLockScriptInfos().infos.length, 0);
  common.registerCustomLockScriptInfos([
    {
      code_hash: "",
      hash_type: "type",
      lockScriptInfo: anyoneCanPay,
    },
  ]);
  t.is(common.__tests__.getLockScriptInfos().infos.length, 1);

  common.__tests__.resetLockScriptInfos();
  t.is(common.__tests__.getLockScriptInfos().infos.length, 0);
  common.__tests__.generateLockScriptInfos({ config: AGGRON4 });
  t.is(common.__tests__.getLockScriptInfos().infos.length, 3);
  const configCodeHash = common.__tests__.getLockScriptInfos().configHashCode;
  t.not(configCodeHash, 0);

  // run again, won't change
  common.__tests__.generateLockScriptInfos({ config: AGGRON4 });
  t.is(common.__tests__.getLockScriptInfos().infos.length, 3);
  t.is(common.__tests__.getLockScriptInfos().configHashCode, configCodeHash);

  // using LINA
  common.__tests__.generateLockScriptInfos({ config: LINA });
  t.is(common.__tests__.getLockScriptInfos().infos.length, 3);
  t.not(common.__tests__.getLockScriptInfos().configHashCode, configCodeHash);
});

test("transfer secp => secp", async (t) => {
  const cellProvider = new CellProvider([...bobSecpInputs]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity), amount);

  t.is(txSkeleton.get("witnesses").size, 1);

  const expectedMessages = [
    "0x997f7d53307a114104b37c0fcdef97240d250d468189e71632d79e1c3b20a4f9",
  ];

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

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

  const amount = BigInt(1500 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress, bob.fromInfo],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity), amount);

  t.is(txSkeleton.get("witnesses").size, 2);

  const expectedMessages = [
    "0x45e7955cbc1ae0f8c2fbb3392a3afcea9ae1ae83c48e4355f131d751325ea615",
    "0x051a18a11dacfd6573a689328ea7ee0cc3f2533de9c15e4f9e12f0e4a6e9691c",
  ];

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

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

  class LocktimePoolCellCollector {
    async *collect() {
      yield {
        ...bobMultisigLockInputs[0],
        since: "0x0",
        depositBlockHash: undefined,
        withdrawBlockHash: undefined,
        sinceBaseValue: undefined,
      };
    }
  }

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.fromInfo],
    alice.testnetAddress,
    amount,
    undefined,
    tipHeader,
    {
      config: AGGRON4,
      LocktimePoolCellCollector,
    }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity), amount);

  t.is(txSkeleton.get("witnesses").size, 1);

  const expectedMessages = [
    "0x54f766189f91dcf10a23833c5b1f0d318044c7237a2a703ad77ea46990190b8b",
  ];

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

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

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    alice.acpTestnetAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(
    BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity) -
      BigInt(aliceAcpCells[0]!.cell_output.capacity),
    amount
  );

  const expectedWitnesses = [
    "0x",
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  ];
  t.deepEqual(txSkeleton.get("witnesses").toJS(), expectedWitnesses);

  const expectedMessages = [
    "0x7449d526fa5fbaf942cbf29f833d89026b6f28322d0bd4725eb8c0b921b3b275",
  ];

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

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

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    alice.acpTestnetAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.is(txSkeleton.get("headerDeps").size, 0);
  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity), amount);

  const expectedWitnesses = [
    "0x55000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  ];
  t.deepEqual(txSkeleton.get("witnesses").toJS(), expectedWitnesses);

  const expectedMessages = [
    "0x68a543a1ef68667281609d9331f3587f4bfac16002f0fbac72e3774de80f45fb",
  ];

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

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

  const amount = BigInt(1000 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [
      {
        address: bob.acpTestnetAddress,
        destroyable: true,
      },
    ],
    bob.testnetAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(sumOfInputCapacity, sumOfOutputCapcity);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.is(BigInt(txSkeleton.get("outputs").get(0)!.cell_output.capacity), amount);

  t.is(txSkeleton.get("witnesses").size, 1);

  const expectedMessages = [
    "0x3196d29d3365c1d3d599be55e80e4addd631acb6605646329eb39a1b9264ab89",
  ];

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

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

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const getCapacities = (cells: List<Cell>): string[] => {
    return cells.map((c) => c.cell_output.capacity).toJS();
  };

  const inputCapacitiesBefore = getCapacities(txSkeleton.get("inputs"));
  const outputCapacitiesBefore = getCapacities(txSkeleton.get("outputs"));

  let errFlag = false;
  try {
    await common.transfer(
      txSkeleton,
      [bob.testnetAddress],
      aliceAddress,
      BigInt(500 * 10 ** 8),
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

  txSkeleton = await common.setupInputCell(
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

const testTx: Transaction = {
  version: "0x0",
  cell_deps: [
    {
      out_point: {
        tx_hash:
          "0xc12386705b5cbb312b693874f3edf45c43a274482e27b8df0fd80c8d3f5feb8b",
        index: "0x0",
      },
      dep_type: "dep_group",
    },
    {
      out_point: {
        tx_hash:
          "0x0fb4945d52baf91e0dee2a686cdd9d84cad95b566a1d7409b970ee0a0f364f60",
        index: "0x2",
      },
      dep_type: "code",
    },
  ],
  header_deps: [],
  inputs: [
    {
      previous_output: {
        tx_hash:
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
        code_hash:
          "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hash_type: "type",
      },
      type: {
        code_hash:
          "0xece45e0979030e2f8909f76258631c42333b1e906fd9701ec3600a464a90b8f6",
        args: "0x",
        hash_type: "data",
      },
    },
    {
      capacity: "0x59e1416a5000",
      lock: {
        code_hash:
          "0x68d5438ac952d2f584abf879527946a537e82c7f3c1cbf6d8ebf9767437d8e88",
        args: "0x59a27ef3ba84f061517d13f42cf44ed020610061",
        hash_type: "type",
      },
      type: undefined,
    },
  ],
  outputs_data: ["0x1234", "0x"],
  witnesses: [
    "0x82df73581bcd08cb9aa270128d15e79996229ce8ea9e4f985b49fbf36762c5c37936caf3ea3784ee326f60b8992924fcf496f9503c907982525a3436f01ab32900",
  ],
};

test("getTransactionSizeByTx", (t) => {
  const size: number = __tests__.getTransactionSizeByTx(testTx);
  t.is(size, 536);
});

test("calculateFee, without carry", (t) => {
  t.is(__tests__.calculateFee(1035, BigInt(1000)), BigInt(1035));
});

test("calculateFee, with carry", (t) => {
  t.is(__tests__.calculateFee(1035, BigInt(900)), BigInt(932));
});

function getExpectedFee(
  txSkeleton: TransactionSkeletonType,
  feeRate: bigint
): bigint {
  return __tests__.calculateFee(
    __tests__.getTransactionSize(txSkeleton),
    feeRate
  );
}

function getFee(txSkeleton: TransactionSkeletonType): bigint {
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const sumOfOutputCapcity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  return sumOfInputCapacity - sumOfOutputCapcity;
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

  const amount = BigInt(1000 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BigInt(1 * 10 ** 8 * 1000);
  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    feeRate,
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(getFee(txSkeleton), getExpectedFee(txSkeleton, feeRate));
});

test("payFeeByFeeRate 1 in 2 out, add nothing", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BigInt(1 * 10 ** 8);
  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    feeRate,
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(getFee(txSkeleton), getExpectedFee(txSkeleton, feeRate));
});

test("payFeeByFeeRate 1 in 2 out, reduce 1 out", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(536 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BigInt(1 * 10 ** 8 * 1000);
  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    feeRate,
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
    getFee(txSkeleton),
    __tests__.calculateFee(ONE_IN_TWO_OUT_SIZE, feeRate)
  );
});

test("payFeeByFeeRate 1 in 2 out, add 1 in", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(600 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BigInt(1 * 10 ** 8 * 1000);
  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    feeRate,
    undefined,
    {
      config: AGGRON4,
    }
  );

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 2);
  t.is(getFee(txSkeleton), getExpectedFee(txSkeleton, feeRate));
});

test("payFeeByFeeRate, capacity 500", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(500 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BigInt(1000);
  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    feeRate,
    undefined,
    {
      config: AGGRON4,
    }
  );

  const expectedFee: bigint = BigInt(464);

  t.is(getFee(txSkeleton), expectedFee);
});

test("payFeeByFeeRate, capacity 1000", async (t) => {
  const cellProvider = new CellProvider(bobSecpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(1000 * 10 ** 8);
  txSkeleton = await common.transfer(
    txSkeleton,
    [bob.testnetAddress],
    aliceAddress,
    amount,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  const feeRate = BigInt(1000);
  txSkeleton = await common.payFeeByFeeRate(
    txSkeleton,
    [bob.testnetAddress],
    feeRate,
    undefined,
    {
      config: AGGRON4,
    }
  );

  const expectedFee: bigint = BigInt(516);

  t.is(getFee(txSkeleton), expectedFee);
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

  const amount = BigInt(600 * 10 ** 8);
  await t.notThrowsAsync(async () => {
    await common.transfer(
      txSkeleton,
      [bob.testnetAddress],
      aliceAddress,
      amount,
      undefined,
      undefined,
      { config }
    );
  });
});
