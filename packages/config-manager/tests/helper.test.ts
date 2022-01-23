import test from "ava";
import { helpers, initializeConfig, predefined } from "../src";

const SECP256K1_BLAKE160 = predefined.LINA.SCRIPTS.SECP256K1_BLAKE160;

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test.beforeEach(() => {
  initializeConfig(predefined.LINA);
});

test("find config by script", (t) => {
  const config = helpers.findConfigByScript({
    code_hash: SECP256K1_BLAKE160.CODE_HASH,
    hash_type: SECP256K1_BLAKE160.HASH_TYPE,
  });

  t.deepEqual(config, SECP256K1_BLAKE160);
});

test("keyof script in config", (t) => {
  const name = helpers.nameOfScript({
    code_hash: SECP256K1_BLAKE160.CODE_HASH,
    hash_type: SECP256K1_BLAKE160.HASH_TYPE,
  });

  t.is(name, "SECP256K1_BLAKE160");
});
