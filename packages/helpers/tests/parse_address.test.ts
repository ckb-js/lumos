import test from "ava";
import { parseAddress, addressToScript } from "../src";
import {
  shortAddressInfo,
  multisigAddressInfo,
  fullAddressInfo,
  fullAddressInfoWithData,
} from "./addresses";
import { predefined } from "@ckb-lumos/config-manager";
import { bech32, bech32m } from "bech32";
import { hexToByteArray } from "../src/utils";
import { ADDRESS_FORMAT_SHORT } from "../src/address-to-script";
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
});

test("full address with data, mtestnet", (t) => {
  const script = parseAddress(fullAddressInfoWithData.testnetAddress, {
    config: AGGRON4,
  });

  t.deepEqual(script, fullAddressInfoWithData.script);
});

test("short address, mainnet, addressToScript", (t) => {
  const script = addressToScript(shortAddressInfo.mainnetAddress, {
    config: LINA,
  });

  t.deepEqual(script, shortAddressInfo.script);
});

test("invalid short address with bech32m", (t) => {
  const args = hexToByteArray("0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a");
  const wrongAddress = bech32m.encode(LINA.PREFIX, bech32m.toWords([0x01, 0x0].concat(args)));

  t.throws(() => addressToScript(wrongAddress, { config: LINA }), {
    message: /Invalid checksum/,
  });
});

test("invalid short address with wrong args length", (t) => {
  /* 21 bytes */
  const args = hexToByteArray("0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a33");
  const wrongAddress = bech32.encode(LINA.PREFIX, bech32m.toWords([0x01, 0x0].concat(args)));
  t.is(wrongAddress, "ckb1qyqylv479ewscx3ms620sv34pgeuz6zagaarxdzvx03");
  t.throws(() => addressToScript(wrongAddress, { config: LINA }), {
    message: /Invalid payload length/,
  });
});

test("invalid address with wrong prefix", (t) => {
  /* 21 bytes */
  const args = hexToByteArray("0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a");
  const wrongAddress = bech32.encode(
    AGGRON4.PREFIX,
    bech32.toWords([ADDRESS_FORMAT_SHORT, 0x0].concat(args))
  );

  t.throws(() => addressToScript(wrongAddress, { config: LINA }), {
    message: /Invalid prefix/,
  });
});

test("invalid code hash index ", (t) => {
  const args = hexToByteArray("0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a");
  const wrongAddress = bech32.encode(
    LINA.PREFIX,
    bech32.toWords([ADDRESS_FORMAT_SHORT, 17].concat(args))
  );

  t.is(wrongAddress, "ckb1qyg5lv479ewscx3ms620sv34pgeuz6zagaaqajch0c");
  t.throws(() => addressToScript(wrongAddress, { config: LINA }), {
    message: /Invalid code hash index: 17/,
  });
});

test("invalid address with too short payload", (t) => {
  const args = hexToByteArray("0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a");
  const wrongAddress = bech32.encode(AGGRON4.PREFIX, bech32.toWords([0x01, 0x0].concat(args)));

  t.throws(() => addressToScript(wrongAddress, { config: LINA }), {
    message: /Invalid prefix/,
  });
});
