import test from "ava";
import { generateAddress, scriptToAddress } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
const { LINA, AGGRON4 } = predefined;
import {
  shortAddressInfo,
  multisigAddressInfo,
  fullAddressInfo,
} from "./addresses";

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
