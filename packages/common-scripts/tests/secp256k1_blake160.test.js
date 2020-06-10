const test = require("ava");
const { CellProvider } = require("./cell_provider");
const { TransactionSkeleton, configs } = require("@ckb-lumos/helpers");
const { secp256k1Blake160 } = require("../lib");
const { LINA } = configs;
const { bob, alice, fullAddressInfo } = require("./account_info");

const inputs = [
  {
    cell_output: {
      capacity: "0x11716ddd8a8e",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
    },
    out_point: {
      tx_hash:
        "0x8ea18fcaa83af496318068fd09c49883269c5eff18748ef3e0dd301108af9c01",
      index: "0x0",
    },
    block_hash:
      "0x70fc58921897f40f0c1b385a7f0e9455484d593dfba928583c770894651320da",
    block_number: "0x1a459",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x11715a47ed38",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
    },
    out_point: {
      tx_hash:
        "0xc8536eaef90f9206041076e51ede8d2e40e4e9fd75fa422fa9fd22580f3b79ac",
      index: "0x0",
    },
    block_hash:
      "0x5141078759d32ed72cb579396ef8c3a0fe0bef581216a4cf15cf97cf60ca2674",
    block_number: "0x763b",
    data: "0x",
  },
  {
    cell_output: {
      capacity: "0x11715a8f47f4",
      lock: {
        code_hash:
          "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
        hash_type: "type",
        args: "0x36c329ed630d6ce750712a477543672adab57f4c",
      },
    },
    out_point: {
      tx_hash:
        "0x8adbe39287d217cab78579af8bae1e0877560d3ab1d7c2019d0e9d62a583b7da",
      index: "0x0",
    },
    block_hash:
      "0x8babe9d40db17962a3b782e58e0c5f380762b22646753a9bf38f9ed1421fba80",
    block_number: "0x7928",
    data: "0x",
  },
];

const cellProvider = new CellProvider(inputs);
let txSkeleton = TransactionSkeleton({ cellProvider });

test("transfer success", async (t) => {
  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
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
});

test("transfer to non secp256k1_blake160 address", async (t) => {
  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    fullAddressInfo.mainnetAddress,
    BigInt(1000 * 10 ** 8)
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

  t.is(txSkeleton.get("outputs").size, 2);
  const targetOutput = txSkeleton.get("outputs").get(0);
  t.deepEqual(targetOutput.cell_output.lock, fullAddressInfo.lock);
  const changeOutput = txSkeleton.get("outputs").get(1);
  const template = LINA.SCRIPTS.SECP256K1_BLAKE160;
  const expectedChangeLockScript = {
    code_hash: template.SCRIPT.code_hash,
    hash_type: template.SCRIPT.hash_type,
    args: bob.blake160,
  };
  t.deepEqual(changeOutput.cell_output.lock, expectedChangeLockScript);
});

test("payFee", async (t) => {
  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  const fee = BigInt(1 * 10 ** 8);
  txSkeleton = await secp256k1Blake160.payFee(
    txSkeleton,
    bob.mainnetAddress,
    fee
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
  t.is(sumOfOutputCapacity + fee, sumOfInputCapacity);

  t.is(txSkeleton.get("inputs").size, 1);
});

test("prepareSigningEntries", async (t) => {
  const expectedMessage =
    "0xd90a4204aee91348bf2ada132065a9a7aa4479001ec61e046c54804987b309ce";

  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
  );

  const fee = BigInt(1 * 10 ** 8);
  txSkeleton = await secp256k1Blake160.payFee(
    txSkeleton,
    bob.mainnetAddress,
    fee
  );

  txSkeleton = await secp256k1Blake160.prepareSigningEntries(txSkeleton);

  // sum of outputs capacity should be equal to sum of inputs capacity
  const sumOfInputCapacity = txSkeleton
    .get("inputs")
    .map((i) => BigInt(i.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  const sumOfOutputCapacity = txSkeleton
    .get("outputs")
    .map((o) => BigInt(o.cell_output.capacity))
    .reduce((result, c) => result + c, BigInt(0));
  t.is(sumOfOutputCapacity + fee, sumOfInputCapacity);

  t.is(txSkeleton.get("inputs").size, 1);

  const message = txSkeleton.get("signingEntries").get(0).message;
  t.is(message, expectedMessage);
});

test("transfer, skip duplicated input", async (t) => {
  const firstInput = inputs[0];
  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(firstInput);
  });
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: firstInput.cell_output,
      data: "0x",
      out_point: null,
      block_hash: null,
    });
  });
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: 0,
    });
  });

  txSkeleton = await secp256k1Blake160.transfer(
    txSkeleton,
    bob.mainnetAddress,
    alice.mainnetAddress,
    BigInt(1000 * 10 ** 8)
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

  t.is(txSkeleton.get("inputs").size, 2);
  t.is(txSkeleton.get("outputs").size, 3);
  t.notDeepEqual(
    txSkeleton.get("inputs").get(0).out_point,
    txSkeleton.get("inputs").get(1).out_point
  );
});
