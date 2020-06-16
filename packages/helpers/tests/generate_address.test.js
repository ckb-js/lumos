const test = require("ava");
const { configs, generateAddress } = require("../lib");
const { LINA, AGGRON4 } = configs;

const {
  shortAddressInfo,
  multisigAddressInfo: multisigAddressInfo,
  fullAddressInfo,
} = require("./addresses");

test("short address, mainnet", (t) => {
  const address = generateAddress(shortAddressInfo.script, { config: LINA });

  t.is(address, shortAddressInfo.mainnetAddress);
});

test("short address, testnet", (t) => {
  const address = generateAddress(shortAddressInfo.script, { config: AGGRON4 });

  t.is(address, shortAddressInfo.testnetAddress);
});

test("multisig short address, mainnet", (t) => {
  const address = generateAddress(multisigAddressInfo.script, {
    config: LINA,
  });

  t.is(address, multisigAddressInfo.mainnetAddress);
});

test("multisig short address, testnet", (t) => {
  const address = generateAddress(multisigAddressInfo.script, {
    config: AGGRON4,
  });

  t.is(address, multisigAddressInfo.testnetAddress);
});

test("full address, mainnet", (t) => {
  const address = generateAddress(fullAddressInfo.script, {
    config: LINA,
  });

  t.is(address, fullAddressInfo.mainnetAddress);
});

test("full address, testnet", (t) => {
  const address = generateAddress(fullAddressInfo.script, {
    config: AGGRON4,
  });

  t.is(address, fullAddressInfo.testnetAddress);
});
