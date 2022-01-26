import test from "ava";
import { serializeMultisigScript, multisigArgs } from "../src/from_info";
import { bob } from "./account_info";
import { parseFromInfo } from "../src";
import { predefined } from "@ckb-lumos/config-manager";
import { parseAddress } from "@ckb-lumos/helpers";
const { AGGRON4 } = predefined;

// from https://github.com/nervosnetwork/rfcs/blob/v2020.01.15/rfcs/0021-ckb-address-format/0021-ckb-address-format.md
const multiInfo = {
  R: 1,
  M: 2,
  publicKeyHashes: [
    "0xbd07d9f32bce34d27152a6a0391d324f79aab854",
    "0x094ee28566dff02a012a66505822a2fd67d668fb",
    "0x4643c241e59e81b7876527ebff23dfb24cf16482",
  ],
  multisigArgs: "0x4fb2be2e5d0c1a3b8694f832350a33c1685d477a",
};

test.before(() => {
  // @ts-ignore: Unreachable code error
  BigInt = () => {
    throw new Error("can not find bigint");
  };
});

test("multisigArgs, single", (t) => {
  const serialized = serializeMultisigScript(bob.fromInfo);
  const args = multisigArgs(serialized);
  t.is(args, bob.multisigArgs);
});

test("multisigArgs, multi", (t) => {
  const serialized = serializeMultisigScript({
    R: multiInfo.R,
    M: multiInfo.M,
    publicKeyHashes: multiInfo.publicKeyHashes,
  });
  const args = multisigArgs(serialized);

  t.is(args, multiInfo.multisigArgs);
});

test("parseFromInfo, secp address", (t) => {
  const result = parseFromInfo(bob.testnetAddress, { config: AGGRON4 });
  const template = AGGRON4.SCRIPTS.SECP256K1_BLAKE160!;

  t.is(result.fromScript.code_hash, template.CODE_HASH);
  t.is(result.fromScript.hash_type, template.HASH_TYPE);
  t.is(result.fromScript.args, bob.blake160);
  t.is(result.multisigScript, undefined);
  t.is(result.destroyable, undefined);
  t.is(result.customData, undefined);
});

test("parseFromInfo, MultisigScript", (t) => {
  const result = parseFromInfo(bob.fromInfo, {
    config: AGGRON4,
  });

  const template = AGGRON4.SCRIPTS.SECP256K1_BLAKE160_MULTISIG!;

  t.is(result.fromScript.code_hash, template.CODE_HASH);
  t.is(result.fromScript.hash_type, template.HASH_TYPE);
  t.is(result.fromScript.args, bob.multisigArgs);
  t.is(result.multisigScript, serializeMultisigScript(bob.fromInfo));
  t.is(result.destroyable, undefined);
  t.is(result.customData, undefined);
});

test("parseFromInfo, ACP, destroyable", (t) => {
  const result = parseFromInfo(
    {
      address: bob.acpTestnetAddress,
      destroyable: true,
    },
    {
      config: AGGRON4,
    }
  );

  const template = AGGRON4.SCRIPTS.ANYONE_CAN_PAY!;

  t.is(result.fromScript.code_hash, template.CODE_HASH);
  t.is(result.fromScript.hash_type, template.HASH_TYPE);
  t.is(result.fromScript.args, bob.blake160);
  t.is(result.multisigScript, undefined);
  t.true(result.destroyable);
  t.is(result.customData, undefined);
});

test("parseFromInfo, ACP, default", (t) => {
  const result = parseFromInfo(
    {
      address: bob.acpTestnetAddress,
    },
    {
      config: AGGRON4,
    }
  );

  const template = AGGRON4.SCRIPTS.ANYONE_CAN_PAY!;

  t.is(result.fromScript.code_hash, template.CODE_HASH);
  t.is(result.fromScript.hash_type, template.HASH_TYPE);
  t.is(result.fromScript.args, bob.blake160);
  t.is(result.multisigScript, undefined);
  t.false(!!result.destroyable);
  t.is(result.customData, undefined);
});

test("parseFromInfo, CustomScript", (t) => {
  const script = parseAddress(bob.acpTestnetAddress, { config: AGGRON4 });
  const customData = "0x1234ab";

  const result = parseFromInfo(
    {
      script,
      customData,
    },
    {
      config: AGGRON4,
    }
  );

  const template = AGGRON4.SCRIPTS.ANYONE_CAN_PAY!;

  t.is(result.fromScript.code_hash, template.CODE_HASH);
  t.is(result.fromScript.hash_type, template.HASH_TYPE);
  t.is(result.fromScript.args, bob.blake160);
  t.is(result.multisigScript, undefined);
  t.is(result.destroyable, undefined);
  t.is(result.customData, customData);
});
