import test from "ava";
import { CellProvider } from "./cell_provider";
import {
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { dao, common } from "../src";
import { predefined, Config } from "@ckb-lumos/config-manager";
const { LINA, AGGRON4 } = predefined;
import { bob } from "./account_info";
import { inputs } from "./secp256k1_blake160_inputs";
import { Script, Cell, HexString, JSBI } from "@ckb-lumos/base";
import {
  bobMultisigDaoInputs,
  bobMultisigInputs,
  bobSecpDaoDepositInput,
  bobSecpDaoWithdrawInput,
} from "./inputs";

const cellProvider = new CellProvider(inputs());
let txSkeleton: TransactionSkeletonType = TransactionSkeleton({ cellProvider });

const generateDaoTypeScript = (config: Config): Script => {
  return {
    code_hash: config.SCRIPTS.DAO!.CODE_HASH,
    hash_type: config.SCRIPTS.DAO!.HASH_TYPE,
    args: "0x",
  };
};

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("deposit secp256k1_blake160", async (t) => {
  txSkeleton = await dao.deposit(
    txSkeleton,
    bob.mainnetAddress,
    bob.mainnetAddress,
    JSBI.BigInt(1000 * 10 ** 8)
  );

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => JSBI.BigInt(i.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => JSBI.BigInt(o.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  t.is(outputCapacity.toString(), inputCapacity.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);

  t.deepEqual(txSkeleton.get("cellDeps").get(0)!.out_point, {
    tx_hash: LINA.SCRIPTS.DAO!.TX_HASH,
    index: LINA.SCRIPTS.DAO!.INDEX,
  });
  t.is(txSkeleton.get("cellDeps").get(0)!.dep_type, LINA.SCRIPTS.DAO!.DEP_TYPE);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  t.is(txSkeleton.get("outputs").size, 2);
  t.deepEqual(
    txSkeleton.get("outputs").get(0)!.cell_output!.type,
    generateDaoTypeScript(LINA)
  );
});

test("withdraw secp256k1_blake160", async (t) => {
  txSkeleton = await dao.deposit(
    txSkeleton,
    bob.mainnetAddress,
    bob.mainnetAddress,
    JSBI.BigInt(1000 * 10 ** 8)
  );

  const fromInput = txSkeleton.get("outputs").get(0)!;
  (fromInput.block_hash = "0x" + "1".repeat(64)),
    (fromInput.block_number = "0x100");
  fromInput.out_point = {
    tx_hash: "0x" + "1".repeat(64),
    index: "0x0",
  };

  txSkeleton = TransactionSkeleton({ cellProvider });
  txSkeleton = await dao.withdraw(txSkeleton, fromInput, bob.mainnetAddress);

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.deepEqual(txSkeleton.get("cellDeps").get(0)!.out_point, {
    tx_hash: LINA.SCRIPTS.DAO!.TX_HASH,
    index: LINA.SCRIPTS.DAO!.INDEX,
  });
  t.is(txSkeleton.get("cellDeps").get(0)!.dep_type, LINA.SCRIPTS.DAO!.DEP_TYPE);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);
  t.not(txSkeleton.get("witnesses").get(0)!, "0x");

  t.is(txSkeleton.get("outputs").size, 1);
  t.is(
    txSkeleton.get("inputs").get(0)!.cell_output.capacity,
    txSkeleton.get("outputs").get(0)!.cell_output.capacity
  );
  t.is(txSkeleton.get("headerDeps").size, 1);
  t.is(txSkeleton.get("headerDeps").get(0)!, fromInput.block_hash);
  t.deepEqual(
    txSkeleton.get("outputs").get(0)!.cell_output.type,
    generateDaoTypeScript(LINA)
  );

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => JSBI.BigInt(i.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => JSBI.BigInt(o.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  t.is(outputCapacity.toString(), inputCapacity.toString());
});

const calculateMaximumWithdrawInfo = {
  depositInput: {
    cell_output: {
      capacity: "0x174876e800",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0xe2193df51d78411601796b35b17b4f8f2cd85bd0",
      },
      type: {
        code_hash:
          "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e",
        hash_type: "type",
        args: "0x",
      },
    },
    out_point: {
      tx_hash:
        "0x9fbcf16a96897c1b0b80d4070752b9f30577d91275f5b460b048b955b58e08eb",
      index: "0x0",
    },
    block_hash:
      "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
    block_number: "0x19249",
    data: "0x0000000000000000",
  },
  depositHeader: {
    compact_target: "0x20010000",
    dao: "0x8eedf002d7c88852433518952edc28002dd416364532c50800d096d05aac0200",
    epoch: "0xa000500283a",
    hash: "0x41d081cd95d705c4e80a6b473f71050efc4a0a0057ee8cab98c4933ad11f0719",
    nonce: "0x98e10e0a992f7274c7dc0c62e9d42f02",
    number: "0x19249",
    parent_hash:
      "0xd4f3e8725de77aedadcf15755c0f6cdd00bc8d4a971e251385b59ce8215a5d70",
    proposals_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: "0x17293289266",
    transactions_root:
      "0x9294a800ec389d1b0d9e7c570c249da260a44cc2790bd4aa250f3d5c83eb8cde",
    uncles_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
  },
  withdrawHeader: {
    compact_target: "0x20010000",
    dao: "0x39d32247d33f90523d37dae613dd280037e9cc1d7b01c708003d8849d8ac0200",
    epoch: "0xa0008002842",
    hash: "0x156ecda80550b6664e5d745b6277c0ae56009681389dcc8f1565d815633ae906",
    nonce: "0x7ffb49f45f12f2b30ac45586ecf13de2",
    number: "0x1929c",
    parent_hash:
      "0xfe601308a34f1faf68906d2338e60246674ed1f1fbbad3d8471daca21a11cdf7",
    proposals_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    timestamp: "0x1729cdd69c9",
    transactions_root:
      "0x467d72af12af6cb122985f9838bfc47073bba30cc37a4075aef54b0f0768f384",
    uncles_hash:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    version: "0x0",
  },
  expectedWithdrawCapacity: BigInt("0x1748ec3fdc"),
};

test("BigInt:calculateMaximumWithdraw", (t) => {
  const {
    depositInput,
    depositHeader,
    withdrawHeader,
    expectedWithdrawCapacity,
  } = calculateMaximumWithdrawInfo;
  const result = dao.calculateMaximumWithdraw(
    depositInput as Cell,
    depositHeader.dao,
    withdrawHeader.dao
  );

  t.is(result, expectedWithdrawCapacity);
});

test("JSBI:calculateMaximumWithdrawCompatible", (t) => {
  const {
    depositInput,
    depositHeader,
    withdrawHeader,
    expectedWithdrawCapacity,
  } = calculateMaximumWithdrawInfo;
  const result = dao.calculateMaximumWithdrawCompatible(
    depositInput as Cell,
    depositHeader.dao,
    withdrawHeader.dao
  );

  t.is(
    result.toString(),
    JSBI.BigInt(expectedWithdrawCapacity.toString()).toString()
  );
});

test("deposit multisig", async (t) => {
  const cellProvider = new CellProvider(bobMultisigInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await dao.deposit(
    txSkeleton,
    bob.fromInfo,
    bob.multisigTestnetAddress,
    JSBI.BigInt(500 * 10 ** 8),
    { config: AGGRON4 }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => JSBI.BigInt(i.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => JSBI.BigInt(o.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  t.is(outputCapacity.toString(), inputCapacity.toString());

  t.is(txSkeleton.get("cellDeps").size, 2);

  t.deepEqual(txSkeleton.get("cellDeps").get(0)!.out_point, {
    tx_hash: AGGRON4.SCRIPTS.DAO!.TX_HASH,
    index: AGGRON4.SCRIPTS.DAO!.INDEX,
  });
  t.is(
    txSkeleton.get("cellDeps").get(0)!.dep_type,
    AGGRON4.SCRIPTS.DAO!.DEP_TYPE
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  t.is(txSkeleton.get("outputs").size, 2);
  t.deepEqual(
    txSkeleton.get("outputs").get(0)!.cell_output!.type,
    generateDaoTypeScript(AGGRON4)
  );

  t.is(txSkeleton.get("signingEntries").size, 1);
  const expectedMessage =
    "0xa41875ea85b7abda153b7aa3c24e2874e30c88d69203a2f8b9bceb6e52e8b73c";
  const message = txSkeleton.get("signingEntries").get(0)!.message;
  t.is(message, expectedMessage);

  t.is(txSkeleton.get("witnesses").size, 1);
  const expectedWitness =
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const witness = txSkeleton.get("witnesses").get(0)!;
  t.is(witness, expectedWitness);
});

test("withdraw multisig", async (t) => {
  const cellProvider = new CellProvider(bobMultisigDaoInputs);
  let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
    cellProvider,
  });

  txSkeleton = await dao.withdraw(
    txSkeleton,
    bobMultisigDaoInputs[0],
    bob.fromInfo,
    {
      config: AGGRON4,
    }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, { config: AGGRON4 });

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.deepEqual(txSkeleton.get("cellDeps").get(0)!.out_point, {
    tx_hash: AGGRON4.SCRIPTS.DAO!.TX_HASH,
    index: AGGRON4.SCRIPTS.DAO!.INDEX,
  });
  t.is(
    txSkeleton.get("cellDeps").get(0)!.dep_type,
    AGGRON4.SCRIPTS.DAO!.DEP_TYPE
  );

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);
  t.not(txSkeleton.get("witnesses").get(0)!, "0x");

  t.is(txSkeleton.get("outputs").size, 1);
  t.is(
    txSkeleton.get("inputs").get(0)!.cell_output.capacity,
    txSkeleton.get("outputs").get(0)!.cell_output.capacity
  );
  t.is(txSkeleton.get("headerDeps").size, 1);
  t.is(
    txSkeleton.get("headerDeps").get(0)!,
    bobMultisigDaoInputs[0].block_hash
  );
  t.deepEqual(
    txSkeleton.get("outputs").get(0)!.cell_output.type,
    generateDaoTypeScript(AGGRON4)
  );

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => JSBI.BigInt(i.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => JSBI.BigInt(o.cell_output.capacity))
    .reduce((result, c) => JSBI.add(result, c), JSBI.BigInt(0));

  t.is(outputCapacity.toString(), inputCapacity.toString());

  const expectedMessage =
    "0x0d54fdf2cb8ec8cfbb41376e8fbd2851866a07724e5f5075d83d8b519279e801";
  const expectedWitness =
    "0x6d000000100000006d0000006d000000590000000000010136c329ed630d6ce750712a477543672adab57f4c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  const message = txSkeleton.get("signingEntries").get(0)!.message;
  t.is(message, expectedMessage);
  const witness = txSkeleton.get("witnesses").get(0);
  t.is(witness, expectedWitness);
});

test("deposit, dao script not exists", async (t) => {
  await t.throwsAsync(
    async () => {
      await dao.deposit(
        txSkeleton,
        bob.mainnetAddress,
        bob.mainnetAddress,
        BigInt(1000 * 10 ** 8),
        {
          config: {
            PREFIX: "ckt",
            SCRIPTS: {},
          },
        }
      );
    },
    undefined,
    "Provided config does not have DAO script setup!"
  );
});

test("deposit, toAddress not exists", async (t) => {
  await t.throwsAsync(
    async () => {
      await dao.deposit(
        txSkeleton,
        bob.mainnetAddress,
        undefined as any,
        BigInt(1000 * 10 ** 8),
        {
          config: {
            PREFIX: "ckt",
            SCRIPTS: {},
          },
        }
      );
    },
    undefined,
    "You must provide a to address!"
  );
});

test("CellCollector, all", async (t) => {
  const cellProvider = new CellProvider(bobMultisigDaoInputs);
  const iter = new dao.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    "all",
    {
      config: AGGRON4,
    }
  ).collect();
  let count = 0;
  while (!(await iter.next()).done) {
    count += 1;
  }

  t.is(count, 1);
});

test("CellCollector, deposit", async (t) => {
  const cellProvider = new CellProvider(bobMultisigDaoInputs);
  const iter = new dao.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    "deposit",
    {
      config: AGGRON4,
    }
  ).collect();
  let count = 0;
  while (!(await iter.next()).done) {
    count += 1;
  }

  t.is(count, 1);
});

test("CellCollector, withdraw", async (t) => {
  const cellProvider = new CellProvider(bobMultisigDaoInputs);
  const iter = new dao.CellCollector(
    bob.multisigTestnetAddress,
    cellProvider,
    "withdraw",
    {
      config: AGGRON4,
    }
  ).collect();
  let count = 0;
  while (!(await iter.next()).done) {
    count += 1;
  }

  t.is(count, 0);
});

test("listDaoCells, deposit", async (t) => {
  const cellProvider = new CellProvider(bobMultisigDaoInputs);
  const iter = dao.listDaoCells(
    cellProvider,
    bob.multisigTestnetAddress,
    "deposit",
    {
      config: AGGRON4,
    }
  );
  let count = 0;
  while (!(await iter.next()).done) {
    count += 1;
  }

  t.is(count, 1);
});

test("BigInt:calculateDaoEarliestSince", (t) => {
  const { depositHeader, withdrawHeader } = calculateMaximumWithdrawInfo;

  const result = dao.calculateDaoEarliestSince(
    depositHeader.epoch,
    withdrawHeader.epoch
  );

  // since: relative = false, type = epochNumber value = { length: 10, index: 5, number: 10478 }
  // if decrease index to 4, will false to validation by dao script
  t.is(result, BigInt("0x20000a00050028ee"));
});

test("JSBI:calculateDaoEarliestSinceCompatible", (t) => {
  const { depositHeader, withdrawHeader } = calculateMaximumWithdrawInfo;

  const result = dao.calculateDaoEarliestSinceCompatible(
    depositHeader.epoch,
    withdrawHeader.epoch
  );

  // since: relative = false, type = epochNumber value = { length: 10, index: 5, number: 10478 }
  // if decrease index to 4, will false to validation by dao script
  t.is(result.toString(), JSBI.BigInt("0x20000a00050028ee").toString());
});

class RpcMocker {
  async get_header(hash: HexString) {
    if (hash === calculateMaximumWithdrawInfo.depositHeader.hash) {
      return calculateMaximumWithdrawInfo.depositHeader;
    }
    if (hash === calculateMaximumWithdrawInfo.withdrawHeader.hash) {
      return calculateMaximumWithdrawInfo.withdrawHeader;
    }
    throw new Error("RpcMocker get_header error!");
  }
}

test("unlock", async (t) => {
  const cellProvider = new CellProvider([bobSecpDaoWithdrawInput]);
  let txSkeleton = TransactionSkeleton({ cellProvider });

  txSkeleton = await dao.unlock(
    txSkeleton,
    bobSecpDaoDepositInput,
    bobSecpDaoWithdrawInput,
    bob.testnetAddress,
    bob.testnetAddress,
    {
      config: AGGRON4,
      RpcClient: RpcMocker as any,
    }
  );

  txSkeleton = common.prepareSigningEntries(txSkeleton, {
    config: AGGRON4,
  });

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("outputs").size, 1);
  t.deepEqual(txSkeleton.get("headerDeps").toJS(), [
    calculateMaximumWithdrawInfo.depositHeader.hash,
    calculateMaximumWithdrawInfo.withdrawHeader.hash,
  ]);

  const expectedMessage =
    "0xf276a45b7dbc018c2e10c4cd0a61915dd28db768894efc1b2c557c9566fc43fd";
  const expectedWitness =
    "0x61000000100000005500000061000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080000000000000000000000";

  t.is(txSkeleton.get("signingEntries").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);

  const message = txSkeleton.get("signingEntries").get(0)!.message;
  const witness = txSkeleton.get("witnesses").get(0)!;

  t.is(message, expectedMessage);
  t.is(witness, expectedWitness);
});
