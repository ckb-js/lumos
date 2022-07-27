import test from "ava";
import { addressToScript, parseAddress } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
import { bech32, bech32m } from "bech32";
import { ADDRESS_FORMAT_FULL, ADDRESS_FORMAT_FULLDATA } from "../src/address-to-script";
import { hexToByteArray } from "../src/utils";
import { Address } from "@ckb-lumos/base";

const LINA = predefined.LINA;
const AGGRON = predefined.AGGRON4;

test("CKB2021 short address 00", (t) => {
  const script = parseAddress("ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v", {
    config: LINA,
  });
  t.deepEqual(script, {
    codeHash: LINA.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
    hashType: LINA.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});

test("CKB2021 short address 01", (t) => {
  const script = parseAddress("ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg", {
    config: LINA,
  });
  t.deepEqual(script, {
    codeHash: LINA.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.CODE_HASH,
    hashType: LINA.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.HASH_TYPE,
    args: "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a",
  });
});

test("CKB2021 full address", (t) => {
  const script = parseAddress(
    "ckb1qjda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xw3vumhs9nvu786dj9p0q5elx66t24n3kxgj53qks",
    {
      config: LINA,
    }
  );
  t.deepEqual(script, {
    codeHash: LINA.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
    hashType: LINA.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});

test("CKB2021 full address hashType=0x02", (t) => {
  const script = parseAddress(
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqkkxdwn",
    { config: AGGRON }
  );
  t.deepEqual(script, {
    codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hashType: "data1",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});

test("invalid ckb2021 address with FULLDATA format encoding", (t) => {
  const wrongAddress = bech32m.encode(
    LINA.PREFIX,
    bech32m.toWords(
      // prettier-ignore
      [ADDRESS_FORMAT_FULLDATA]
        .concat(hexToByteArray("0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"))
        .concat(hexToByteArray("0x4fb2be2e5d0c1a3b86"))
    )
  );

  t.is(wrongAddress, "ckb1q2da0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsnajhch96rq68wrqn2tmhm");
  t.throws(() => parseAddress(wrongAddress), { message: /Invalid checksum/ });
});

test("invalid ckb2021 address with bech32 encoding", (t) => {
  const cases: [number, Address][] = [
    [1 /* type */, "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq20k2lzuhgvrgacv4tmr88"],
    [0 /* data */, "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqz0k2lzuhgvrgacvhcym08"],
    [2 /* data1 */, "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqj0k2lzuhgvrgacvnhnzl8"],
  ];

  cases.forEach(([hashType, address]) => {
    const wrongAddress = bech32.encode(
      LINA.PREFIX,
      bech32.toWords(
        // prettier-ignore
        [ADDRESS_FORMAT_FULL]
          .concat(hexToByteArray("0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"))
          .concat(hashType)
          .concat(hexToByteArray('0x4fb2be2e5d0c1a3b86'))
      )
    );

    t.is(wrongAddress, address);
    t.throws(() => addressToScript(wrongAddress), {
      message: /Invalid/,
    });
  });
});
