import test from "ava";
import { serializeMultisigScript, multisigArgs } from "../src/from_info";
import { bob } from "./account_info";

const bobInfo = {
  script: bob.fromInfo,
  multisigArgs: "0x56f281b3d4bb5fc73c751714af0bf78eb8aba0d8",
};

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

test("multisigArgs, single", (t) => {
  const serialized = serializeMultisigScript(bobInfo.script);
  const args = multisigArgs(serialized);
  t.is(args, bobInfo.multisigArgs);
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
