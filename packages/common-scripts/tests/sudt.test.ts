import test from "ava";
import { sudt, LocktimeCell, anyoneCanPay } from "../src";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeletonType,
  TransactionSkeleton,
} from "@ckb-lumos/helpers";
import { Cell, Header } from "@ckb-lumos/base";
import { bob, alice } from "./account_info";
import { predefined } from "@ckb-lumos/config-manager";
import { utils } from "@ckb-lumos/base";
import { isSudtScript } from "../src/helper";
const { readBigUInt128LE } = utils;
const { AGGRON4 } = predefined;

const secpInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: undefined,
    },
    data: "0x",
    out_point: {
      tx_hash:
        "0x486ead64a7c2c1a3132c2e03d2af364050f4f0f6dfafad291daa7db6aed53e10",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

const sudtInputs: Cell[] = [
  {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
      type: {
        code_hash:
          "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
        hash_type: "data",
        args:
          "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
      },
    },
    data: "0x10270000000000000000000000000000",
    out_point: {
      tx_hash:
        "0x6747f0fa9ae72efc75079b5f7b2347f965df0754e22818f511750f1f2d08d2cc",
      index: "0x0",
    },
    block_hash:
      "0x1111111111111111111111111111111111111111111111111111111111111111",
    block_number: "0x1",
  },
];

const multisigSudtInput: LocktimeCell = {
  cell_output: {
    capacity: "0x4a817c800",
    lock: {
      code_hash:
        "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8",
      hash_type: "type",
      args: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d80000000000000000",
    },
    type: {
      code_hash:
        "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
      hash_type: "data",
      args:
        "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
    },
  },
  data: "0x10270000000000000000000000000000",
  out_point: {
    tx_hash:
      "0x6747f0fa9ae72efc75079b5f7b2347f965df0754e22818f511750f1f2d08d2cc",
    index: "0x1",
  },
  block_hash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  block_number: "0x1",
  maximumCapacity: BigInt(20000000000),
  since: "0x0",
  depositBlockHash: undefined,
  withdrawBlockHash: undefined,
  sinceBaseValue: undefined,
};

const bobAcpSudtInput: Cell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      code_hash:
        "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
      hash_type: "type",
      args: "0x36c329ed630d6ce750712a477543672adab57f4c",
    },
    type: {
      code_hash:
        "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
      hash_type: "data",
      args:
        "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
    },
  },
  data: "0x10270000000000000000000000000000",
  out_point: {
    tx_hash:
      "0xbe405f293f2a7c981b7ff77a3b59eac192ebd5416a4f5c41728f84e94fb9f8fa",
    index: "0x0",
  },
  block_hash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  block_number: "0x1",
};

const aliceAcpSudtInput: Cell = {
  cell_output: {
    capacity: "0x174876e800",
    lock: {
      code_hash:
        "0x86a1c6987a4acbe1a887cca4c9dd2ac9fcb07405bbeda51b861b18bbf7492c4b",
      hash_type: "type",
      args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
    },
    type: {
      code_hash:
        "0x48dbf59b4c7ee1547238021b4869bceedf4eea6b43772e5d66ef8865b6ae7212",
      hash_type: "data",
      args:
        "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d",
    },
  },
  data: "0xd0070000000000000000000000000000",
  out_point: {
    tx_hash:
      "0xde542cd098d64b3420b5a9f08d48d8745bff268655e51f473a009423193a30fd",
    index: "0x0",
  },
  block_hash:
    "0x1111111111111111111111111111111111111111111111111111111111111111",
  block_number: "0x1",
};

const tipHeader: Header = {
  compact_target: "0x1d4543f7",
  dao: "0x85f96976f65bbf2fc56358de57bb2300a51874a76a153b000068217d4ec10507",
  epoch: "0x28d00ae00013e",
  hash: "0x2a68f7a4162a80c2b9cea95cf8b0d2ff43de80eec0fb37c78a9650271053ba24",
  nonce: "0xf37f9e024d995f35443443be1169f4f9",
  number: "0x36281",
  parent_hash:
    "0x4b714a2d708e49a2ccc27088861b85038525afe06fc69ba9961af272ed94e3ff",
  proposals_hash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  timestamp: "0x1734b70be18",
  transactions_root:
    "0x3aa8da1d229a6fb5d85ae5d71c6db4f6de9eefab288f2d635a79d0f2a610bc67",
  uncles_hash:
    "0x0000000000000000000000000000000000000000000000000000000000000000",
  version: "0x0",
};

test("issueToken", async (t) => {
  const cellProvider = new CellProvider(secpInputs);
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

const bobLockHash =
  "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d";

test("transfer secp", async (t) => {
  const cellProvider = new CellProvider(sudtInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bob.testnetAddress],
    bobLockHash,
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
  const cellProvider = new CellProvider(secpInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const since = "0x0";
  const amount = BigInt(10000);

  const locktimePoolCellCollector = async function* () {
    yield multisigSudtInput;
  };

  txSkeleton = await sudt.transfer(
    txSkeleton,
    [
      {
        ...bob.fromInfo,
        since,
      },
      bob.testnetAddress,
    ],
    bobLockHash,
    alice.testnetAddress,
    amount,
    bob.testnetAddress,
    undefined,
    tipHeader,
    { config: AGGRON4, locktimePoolCellCollector }
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

  t.is(sudtToken, bobLockHash);
});

test("ownerForSudt, by MultisigScript", (t) => {
  const sudtToken = sudt.ownerForSudt(bob.fromInfo);

  const expectedToken =
    "0x52ac8ff1f0486783a5a6a30659715fcee67709c75172ff7b015910ced4586436";

  t.is(sudtToken, expectedToken);
});

const bobAcpAddress =
  "ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykykdkr98kkxrtvuag8z2j8w4pkw2k6k4l5cgxhkrr";
const aliceAcpAddress =
  "ckt1qjr2r35c0f9vhcdgslx2fjwa9tylevr5qka7mfgmscd33wlhfykyhcse8h6367zpzcqhj6e4k9a5lrevmpdaq9kve7y";

test("transfer acp", async (t) => {
  const cellProvider = new CellProvider([bobAcpSudtInput, aliceAcpSudtInput]);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  const amount = BigInt(10000);
  txSkeleton = await sudt.transfer(
    txSkeleton,
    [bobAcpAddress],
    bobLockHash,
    aliceAcpAddress,
    amount,
    bobAcpAddress,
    undefined,
    undefined,
    { config: AGGRON4 }
  );

  txSkeleton = anyoneCanPay.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.log("txSkeleton:", JSON.stringify(txSkeleton, null, 2));

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
    amount + readBigUInt128LE(aliceAcpSudtInput.data)
  );

  t.true(
    isSudtScript(txSkeleton.get("outputs").get(0)!.cell_output.type, AGGRON4)
  );

  const expectedMessage =
    "0x12b4972ea24878f962e90c7cd0ab6019f7bd7629c85a8dfa33f66a272ea1bf0f";
  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("signingEntries").get(0)!.message, expectedMessage);
});
