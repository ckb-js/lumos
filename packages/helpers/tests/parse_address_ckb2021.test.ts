import test from "ava";
import { parseAddress } from "../src";
import { predefined } from "@ckb-lumos/config-manager";

const LINA = predefined.LINA;
const AGGRON = predefined.AGGRON4;

test("CKB2021 short address 00", (t) => {
  const script = parseAddress(
    "ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v",
    {
      config: LINA,
    }
  );
  t.deepEqual(script, {
    code_hash: LINA.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
    hash_type: LINA.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});

test("CKB2021 short address 01", (t) => {
  const script = parseAddress(
    "ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg",
    {
      config: LINA,
    }
  );
  t.deepEqual(script, {
    code_hash: LINA.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.CODE_HASH,
    hash_type: LINA.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!.HASH_TYPE,
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
    code_hash: LINA.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
    hash_type: LINA.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});

test("CKB2021 full address hash_type=0x02", (t) => {
  const script = parseAddress(
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqkkxdwn",
    { config: AGGRON }
  );
  t.deepEqual(script, {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "data1",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});
