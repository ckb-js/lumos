import test from "ava";
import { parseAddress } from "../src";
import { predefined } from "@ckb-lumos/config-manager";

const LINA = predefined.CKB2021(predefined.LINA);

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
      config: {
        CKB2021: true,
        PREFIX: "ckb",
        SCRIPTS: {
          ...LINA.SCRIPTS,
          SECP256K1_BLAKE160: {
            ...LINA.SCRIPTS.SECP256K1_BLAKE160!,
            SHORT_ID: undefined,
          },
        },
      },
    }
  );
  t.deepEqual(script, {
    code_hash: LINA.SCRIPTS.SECP256K1_BLAKE160!.CODE_HASH,
    hash_type: LINA.SCRIPTS.SECP256K1_BLAKE160!.HASH_TYPE,
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  });
});
