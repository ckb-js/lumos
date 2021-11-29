import test from "ava";
import {
  generateAddress,
  generateSecp256k1Blake160Address,
  generateSecp256k1Blake160MultisigAddress,
  scriptToAddress,
} from "../src";
import { predefined, CKB2019 } from "@ckb-lumos/config-manager";

const LINA = CKB2019(predefined.LINA);
const AGGRON4 = CKB2019(predefined.AGGRON4);

import {
  shortAddressInfo,
  multisigAddressInfo,
  fullAddressInfo,
} from "./addresses";

test("short address, mainnet", (t) => {
  const address = generateAddress(shortAddressInfo.script, {
    config: LINA,
    __generateShortAddressWhenShortIDInConfig: true,
  });

  t.is(address, shortAddressInfo.mainnetAddress);
});

test("short address, testnet", (t) => {
  const address = generateAddress(shortAddressInfo.script, {
    config: AGGRON4,
    __generateShortAddressWhenShortIDInConfig: true,
  });

  t.is(address, shortAddressInfo.testnetAddress);
});

test("multisig short address, mainnet", (t) => {
  const address = generateAddress(multisigAddressInfo.script, {
    config: LINA,
    __generateShortAddressWhenShortIDInConfig: true,
  });

  t.is(address, multisigAddressInfo.mainnetAddress);
});

test("multisig short address, testnet", (t) => {
  const address = generateAddress(multisigAddressInfo.script, {
    config: AGGRON4,
    __generateShortAddressWhenShortIDInConfig: true,
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
  const address = scriptToAddress(shortAddressInfo.script, {
    config: LINA,
    __generateShortAddressWhenShortIDInConfig: true,
  });

  t.is(address, shortAddressInfo.mainnetAddress);
});

test("generateSecp256k1Blake160Address, testnet", (t) => {
  const address = generateSecp256k1Blake160Address(
    shortAddressInfo.script.args,
    { config: AGGRON4, __generateShortAddressWhenShortIDInConfig: true }
  );

  t.is(address, shortAddressInfo.testnetAddress);
});

test("generateSecp256k1Blake160Address, mainnet", (t) => {
  const address = generateSecp256k1Blake160Address(
    shortAddressInfo.script.args,
    { config: LINA, __generateShortAddressWhenShortIDInConfig: true }
  );

  t.is(address, shortAddressInfo.mainnetAddress);
});

test("generateSecp256k1Blake160MultisigAddress, testnet", (t) => {
  const address = generateSecp256k1Blake160MultisigAddress(
    multisigAddressInfo.script.args,
    { config: AGGRON4, __generateShortAddressWhenShortIDInConfig: true }
  );

  t.is(address, multisigAddressInfo.testnetAddress);
});

test("generateSecp256k1Blake160MultisigAddress, mainnet", (t) => {
  const address = generateSecp256k1Blake160MultisigAddress(
    multisigAddressInfo.script.args,
    { config: LINA, __generateShortAddressWhenShortIDInConfig: true }
  );

  t.is(address, multisigAddressInfo.mainnetAddress);
});
