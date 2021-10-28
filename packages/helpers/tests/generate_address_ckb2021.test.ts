import test from "ava";
import { generateAddress } from "../src";
import { predefined, ScriptConfig } from "@ckb-lumos/config-manager";
import { Script } from "@ckb-lumos/base";

const LINA = predefined.CKB2019(predefined.LINA);

function ScriptFrom(config: ScriptConfig, args: string): Script {
  return {
    hash_type: config.HASH_TYPE,
    code_hash: config.CODE_HASH,
    args,
  };
}

test("test ckb2021 short generateAddress 00", (t) => {
  const address = generateAddress(
    ScriptFrom(
      LINA.SCRIPTS.SECP256K1_BLAKE160!,
      "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
    ),
    {
      config: LINA,
    }
  );

  t.is(address, "ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v");
});

test("test CKB2021 full generateAddress", (t) => {
  const address = generateAddress(
    {
      code_hash:
        "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
      hash_type: "type",
      args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
    },
    {
      config: {
        CKB2021: true,
        PREFIX: "ckb",
        SCRIPTS: {},
      },
    }
  );

  t.is(
    address,
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4"
  );
});
