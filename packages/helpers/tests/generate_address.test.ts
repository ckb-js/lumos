import test from "ava";
import {
  generateAddress,
  generateSecp256k1Blake160Address,
  generateSecp256k1Blake160MultisigAddress,
  scriptToAddress,
} from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { LINA, AGGRON4 } = predefined;
import {
  shortAddressInfo,
  multisigAddressInfo,
  fullAddressInfo,
} from "./addresses";

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

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

test("short address, mainnet, scriptToAddress", (t) => {
  const address = scriptToAddress(shortAddressInfo.script, { config: LINA });

  t.is(address, shortAddressInfo.mainnetAddress);
});

test("generateSecp256k1Blake160Address, testnet", (t) => {
  const address = generateSecp256k1Blake160Address(
    shortAddressInfo.script.args,
    { config: AGGRON4 }
  );

  t.is(address, shortAddressInfo.testnetAddress);
});

test("generateSecp256k1Blake160Address, mainnet", (t) => {
  const address = generateSecp256k1Blake160Address(
    shortAddressInfo.script.args,
    { config: LINA }
  );

  t.is(address, shortAddressInfo.mainnetAddress);
});

test("generateSecp256k1Blake160MultisigAddress, testnet", (t) => {
  const address = generateSecp256k1Blake160MultisigAddress(
    multisigAddressInfo.script.args,
    { config: AGGRON4 }
  );

  t.is(address, multisigAddressInfo.testnetAddress);
});

test("generateSecp256k1Blake160MultisigAddress, mainnet", (t) => {
  const address = generateSecp256k1Blake160MultisigAddress(
    multisigAddressInfo.script.args,
    { config: LINA }
  );

  t.is(address, multisigAddressInfo.mainnetAddress);
});

test("generateSecp256k1Blake160Address, empty config", (t) => {
  const emptyConfig = {
    PREFIX: "ckb",
    SCRIPTS: {},
  };
  const error = t.throws(() =>
    generateSecp256k1Blake160Address(shortAddressInfo.script.args, {
      config: emptyConfig,
    })
  );
  t.is(
    error.message,
    "Invalid script type: SECP256K1_BLAKE160, only support: "
  );
});
