import test from "ava";
import {
  encodeToAddress,
  encodeToSecp256k1Blake160Address,
  encodeToSecp256k1Blake160MultisigAddress,
  generateAddress,
} from "../src";
import { CKB2021, Config, predefined } from "@ckb-lumos/config-manager";
import { HashType, Script } from "@ckb-lumos/base";

const LINA = CKB2021(predefined.LINA);
const AGGRON4 = CKB2021(predefined.AGGRON4);

type NetworkType = keyof typeof predefined;

function ScriptFrom(
  scriptName: keyof typeof predefined.LINA.SCRIPTS,
  args: string,
  hash_type?: HashType
): { LINA: Script; AGGRON4: Script } {
  return {
    LINA: {
      code_hash: LINA.SCRIPTS[scriptName]!.CODE_HASH,
      hash_type: hash_type || LINA.SCRIPTS[scriptName]!.HASH_TYPE,
      args,
    },
    AGGRON4: {
      code_hash: AGGRON4.SCRIPTS[scriptName]!.CODE_HASH,
      hash_type: hash_type || AGGRON4.SCRIPTS[scriptName]!.HASH_TYPE,
      args,
    },
  };
}

function ConfigFrom(
  networkType: NetworkType,
  options: { excludeShortId?: boolean; CKB2021?: boolean } = {}
): Config {
  const { excludeShortId = false } = options;
  const config = options.CKB2021
    ? CKB2021(predefined[networkType])
    : predefined[networkType];
  return {
    ...config,
    SCRIPTS: excludeShortId ? {} : config.SCRIPTS,
  };
}

test("default short address (code_hash_index = 0x00)", (t) => {
  const script = ScriptFrom(
    "SECP256K1_BLAKE160",
    "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
  );

  t.is(
    generateAddress(script.LINA, { config: ConfigFrom("LINA") }),
    "ckb1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jqfwyw5v"
  );

  t.is(
    generateAddress(script.AGGRON4, { config: ConfigFrom("AGGRON4") }),
    "ckt1qyqt8xaupvm8837nv3gtc9x0ekkj64vud3jq5t63cs"
  );
});

test("multisign short address (code_hash_index = 0x01)", (t) => {
  const script = ScriptFrom(
    "SECP256K1_BLAKE160_MULTISIG",
    "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a"
  );

  t.is(
    generateAddress(script.LINA, { config: ConfigFrom("LINA") }),
    "ckb1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqklhtgg"
  );

  t.is(
    generateAddress(script.AGGRON4, { config: ConfigFrom("AGGRON4") }),
    "ckt1qyq5lv479ewscx3ms620sv34pgeuz6zagaaqt6f5y5"
  );
});

test("acp short address (code_hash_index = 0x02)", (t) => {
  const script = ScriptFrom(
    "ANYONE_CAN_PAY",
    "0xbd07d9f32bce34d27152a6a0391d324f79aab854"
  );

  t.is(
    generateAddress(script.LINA, { config: ConfigFrom("LINA") }),
    "ckb1qypt6p7e7v4uudxjw9f2dgper5ey77d2hp2qxz4u4u"
  );

  t.is(
    generateAddress(script.AGGRON4, { config: ConfigFrom("AGGRON4") }),
    "ckt1qypt6p7e7v4uudxjw9f2dgper5ey77d2hp2qm8treq"
  );
});

test("full address test (hash_type = 0x00)", (t) => {
  const script: Script = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "data",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  };

  t.is(
    generateAddress(script, {
      config: CKB2021(
        ConfigFrom("LINA", { excludeShortId: true, CKB2021: true })
      ),
    }),
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq9nnw7qkdnnclfkg59uzn8umtfd2kwxceqvguktl"
  );

  t.is(
    generateAddress(script, {
      config: ConfigFrom("AGGRON4", { excludeShortId: true, CKB2021: true }),
    }),
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq9nnw7qkdnnclfkg59uzn8umtfd2kwxceqz6hep8"
  );
});

test("full address test (hash_type = 0x01)", (t) => {
  const script: Script = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "type",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  };

  t.is(
    generateAddress(script, {
      config: ConfigFrom("LINA", { excludeShortId: true, CKB2021: true }),
    }),
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4"
  );

  t.is(
    generateAddress(script, {
      config: ConfigFrom("AGGRON4", { excludeShortId: true, CKB2021: true }),
    }),
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqgutnjd"
  );
});

test("full address test (hash_type = 0x02)", (t) => {
  const script: Script = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "data1",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  };

  t.is(
    generateAddress(script, {
      config: ConfigFrom("LINA", { excludeShortId: true, CKB2021: true }),
    }),
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqcydzyt"
  );

  t.is(
    generateAddress(script, {
      config: ConfigFrom("AGGRON4", { excludeShortId: true, CKB2021: true }),
    }),
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqkkxdwn"
  );
});

test("[encodeToAddress] full address test (hash_type = 0x02)", (t) => {
  const script: Script = {
    code_hash:
      "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
    hash_type: "data1",
    args: "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
  };

  t.is(
    encodeToAddress(script, {
      config: ConfigFrom("LINA"),
    }),
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqcydzyt"
  );

  t.is(
    encodeToAddress(script, {
      config: ConfigFrom("AGGRON4"),
    }),
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsq4nnw7qkdnnclfkg59uzn8umtfd2kwxceqkkxdwn"
  );
});

test("[encodeToAddress] default short address (code_hash_index = 0x00)", (t) => {
  const script = ScriptFrom(
    "SECP256K1_BLAKE160",
    "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64"
  );

  t.is(
    encodeToAddress(script.LINA, { config: ConfigFrom("LINA") }),
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4"
  );

  t.is(
    encodeToAddress(script.AGGRON4, { config: ConfigFrom("AGGRON4") }),
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqgutnjd"
  );
});

test("encode predefined secp256k1 script to address", (t) => {
  t.is(
    encodeToSecp256k1Blake160Address(
      "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
      { config: ConfigFrom("LINA") }
    ),
    "ckb1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqxwquc4"
  );

  t.is(
    encodeToSecp256k1Blake160Address(
      "0xb39bbc0b3673c7d36450bc14cfcdad2d559c6c64",
      { config: ConfigFrom("AGGRON4") }
    ),
    "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqdnnw7qkdnnclfkg59uzn8umtfd2kwxceqgutnjd"
  );
});

test("encode predefined multi_sig secp256k1 script to address", (t) => {
  t.is(
    encodeToSecp256k1Blake160MultisigAddress(
      "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a",
      { config: ConfigFrom("LINA") }
    ),
    "ckb1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq20k2lzuhgvrgacd98cxg6s5v7pdpw5w7s0mu7z2"
  );

  t.is(
    encodeToSecp256k1Blake160MultisigAddress(
      "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a",
      { config: ConfigFrom("AGGRON4") }
    ),
    "ckt1qpw9q60tppt7l3j7r09qcp7lxnp3vcanvgha8pmvsa3jplykxn32sq20k2lzuhgvrgacd98cxg6s5v7pdpw5w7spfh3gj"
  );
});
