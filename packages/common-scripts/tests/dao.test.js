const test = require("ava");
const { CellProvider } = require("./cell_provider");
const { TransactionSkeleton } = require("@ckb-lumos/helpers");
const { dao } = require("../lib");
const { predefined } = require("@ckb-lumos/config-manager");
const { LINA } = predefined;
const { bob } = require("./account_info");
const { inputs } = require("./secp256k1_blake160_inputs");

const cellProvider = new CellProvider(inputs);
let txSkeleton = TransactionSkeleton({ cellProvider });

const generateDaoTypeScript = (config) => {
  return {
    code_hash: config.SCRIPTS.DAO.CODE_HASH,
    hash_type: config.SCRIPTS.DAO.HASH_TYPE,
    args: "0x",
  };
};

test("deposit", async (t) => {
  txSkeleton = await dao.deposit(
    txSkeleton,
    undefined,
    bob.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  t.is(txSkeleton.get("cellDeps").size, 1);
  t.deepEqual(
    txSkeleton.get("cellDeps").get(0).OUT_POINT,
    LINA.SCRIPTS.DAO.out_point
  );
  t.is(txSkeleton.get("cellDeps").get(0).DEP_TYPE, LINA.SCRIPTS.DAO.dep_type);

  t.is(txSkeleton.get("inputs").size, 0);
  t.is(txSkeleton.get("witnesses").size, 0);

  t.is(txSkeleton.get("outputs").size, 1);
  t.deepEqual(
    txSkeleton.get("outputs").get(0).cell_output.type,
    generateDaoTypeScript(LINA)
  );
});

test("deposit secp256k1_blake160", async (t) => {
  txSkeleton = await dao.deposit(
    txSkeleton,
    bob.mainnetAddress,
    bob.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(outputCapacity, inputCapacity);

  t.is(txSkeleton.get("cellDeps").size, 2);
});

test("withdraw secp256k1_blake160", async (t) => {
  txSkeleton = await dao.deposit(
    txSkeleton,
    bob.mainnetAddress,
    bob.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  const fromInput = txSkeleton.get("outputs").get(0);
  (fromInput.block_hash = "0x" + "1".repeat(64)),
    (fromInput.block_number = "0x100");
  fromInput.out_point = {
    tx_hash: "0x" + "1".repeat(64),
    index: "0x0",
  };

  txSkeleton = TransactionSkeleton({ cellProvider });
  txSkeleton = await dao.withdraw(txSkeleton, fromInput, bob.mainnetAddress);

  t.is(txSkeleton.get("cellDeps").size, 2);
  t.deepEqual(
    txSkeleton.get("cellDeps").get(0).OUT_POINT,
    LINA.SCRIPTS.DAO.out_point
  );
  t.is(txSkeleton.get("cellDeps").get(0).DEP_TYPE, LINA.SCRIPTS.DAO.dep_type);

  t.is(txSkeleton.get("inputs").size, 1);
  t.is(txSkeleton.get("witnesses").size, 1);
  t.not(txSkeleton.get("witnesses").get(0), "0x");

  t.is(txSkeleton.get("outputs").size, 1);
  t.is(
    txSkeleton.get("inputs").get(0).cell_output.capacity,
    txSkeleton.get("outputs").get(0).cell_output.capacity
  );
  t.is(txSkeleton.get("headerDeps").size, 1);
  t.is(txSkeleton.get("headerDeps").get(0), fromInput.block_hash);
  t.deepEqual(
    txSkeleton.get("outputs").get(0).cell_output.type,
    generateDaoTypeScript(LINA)
  );

  const inputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  const outputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));

  t.is(outputCapacity, inputCapacity);
});

// TODO: add deposit/withdraw tests with secp256k1_blake160_multisig
