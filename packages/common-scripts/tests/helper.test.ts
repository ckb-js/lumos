import test from "ava";
import * as hd from "@ckb-lumos/hd";
import { omnilock } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
import { isOmnilockAddress } from "../src/helper";
import { Script } from "@ckb-lumos/base";
import { encodeToAddress } from "@ckb-lumos/helpers";
const { AGGRON4 } = predefined;

test("should isOmnilockAddress return expected", (t) => {
  const ALICE_PRIVKEY =
    "0x1234567812345678123456781234567812345678123456781234567812345678";
  const aliceArgs = hd.key.privateKeyToBlake160(ALICE_PRIVKEY);
  console.log("alice args is:", aliceArgs);

  const aliceOmnilock: Script = omnilock.createOmnilockScript(
    {
      auth: {
        flag: "SECP256K1_BLAKE160",
        content: aliceArgs,
      },
    },
    { config: AGGRON4 }
  );
  const result = isOmnilockAddress(
    encodeToAddress(aliceOmnilock, { config: AGGRON4 }),
    AGGRON4
  );
  t.is(result, true);
});
