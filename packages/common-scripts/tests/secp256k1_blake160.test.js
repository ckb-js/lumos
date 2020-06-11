const test = require("ava");
const { CellProvider } = require("./cell_provider");
const { TransactionSkeleton, configs } = require("@ckb-lumos/helpers");
const { secp256k1Blake160 } = require("../lib");
const { LINA } = configs;
const { bob, alice, fullAddressInfo } = require("./account_info");
const { inputs } = require("./secp256k1_blake160_inputs");

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
