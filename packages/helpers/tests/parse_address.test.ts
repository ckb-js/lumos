import test from "ava";
import { parseAddress, addressToScript } from "../src";
import {
  shortAddressInfo,
  multisigAddressInfo,
  fullAddressInfo,
  fullAddressInfoWithData
} from "./addresses";
import { predefined } from "@ckb-lumos/config-manager";
const { LINA, AGGRON4 } = predefined;

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("short address, mainnet", (t) => {
  const script = parseAddress(shortAddressInfo.mainnetAddress, {
    config: LINA,
  });

  t.deepEqual(script, shortAddressInfo.script);
});

test("short address, testnet", (t) => {
  const script = parseAddress(shortAddressInfo.testnetAddress, {
    config: AGGRON4,
  });

  t.deepEqual(script, shortAddressInfo.script);
});

test("short address, config not match address version", (t) => {
  t.throws(() => {
    parseAddress(shortAddressInfo.testnetAddress, { config: LINA });
  });
});

test("multisig address, mainnet", (t) => {
  const script = parseAddress(multisigAddressInfo.mainnetAddress);

  t.deepEqual(script, multisigAddressInfo.script);
});

test("multisig address, testnet", (t) => {
  const script = parseAddress(multisigAddressInfo.testnetAddress, {
    config: AGGRON4,
  });

  t.deepEqual(script, multisigAddressInfo.script);
});

test("full address, mainnet", (t) => {
  const script = parseAddress(fullAddressInfo.mainnetAddress);

  t.deepEqual(script, fullAddressInfo.script);
});

test("full address, testnet", (t) => {
  const script = parseAddress(fullAddressInfo.testnetAddress, {
    config: AGGRON4,
  });

  t.deepEqual(script, fullAddressInfo.script);
});

test("full address with data, mainnet", (t) => {
  const script = parseAddress(fullAddressInfoWithData.mainnetAddress);

  t.deepEqual(script, fullAddressInfoWithData.script);
})

test("full address with data, mtestnet", (t) => {
  const script = parseAddress(fullAddressInfoWithData.testnetAddress, {
    config: AGGRON4,
  });

  t.deepEqual(script, fullAddressInfoWithData.script);
})

test("short address, mainnet, addressToScript", (t) => {
  const script = addressToScript(shortAddressInfo.mainnetAddress, {
    config: LINA,
  });

  t.deepEqual(script, shortAddressInfo.script);
});
