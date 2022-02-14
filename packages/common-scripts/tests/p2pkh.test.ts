import test from "ava";
import { Script, utils } from "@ckb-lumos/base";
import { Reader } from "@ckb-lumos/toolkit";
import * as config from "@ckb-lumos/config-manager";
import { default as createKeccak } from "keccak";
import { createP2PKHMessageGroup } from "../src/p2pkh";
import { txObject, txSkeletonFromJson } from "./helper";
import p2pkhJson from "./p2pkh.json";

const CONFIG = config.createConfig({
  PREFIX: "ckt",
  SCRIPTS: {
    ...config.predefined.AGGRON4.SCRIPTS,
    OMNI_LOCK: p2pkhJson.SCRIPTS.OMNI_LOCK as config.ScriptConfig,
    PW_LOCK: p2pkhJson.SCRIPTS.PW_LOCK as config.ScriptConfig,
  },
});

test("omni lock [g1]", (t) => {
  const SIGNATURE_PLACEHOLDER = new Reader("0x" + "00".repeat(85));
  let tx = txSkeletonFromJson(
    p2pkhJson["OMNI_LOCK_[G1]"].tx as txObject,
    SIGNATURE_PLACEHOLDER
  );

  const hasher = new utils.CKBHasher();
  const signLock = p2pkhJson["OMNI_LOCK_[G1]"].SIGN_LOCK as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock], {
    hasher: {
      update: (message) => hasher.update(message.buffer),
      digest: () => new Uint8Array(hasher.digestReader().toArrayBuffer()),
    },
  });
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(messageGroup[0].message, p2pkhJson["OMNI_LOCK_[G1]"].MESSAGE);
});

test("pw lock [g1]", (t) => {
  const SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  let tx = txSkeletonFromJson(
    p2pkhJson["PW_LOCK_[G1]"].tx as txObject,
    SIGNATURE_PLACEHOLDER
  );

  const keccak = createKeccak("keccak256");
  const signLock = p2pkhJson["PW_LOCK_[G1]"].SIGN_LOCK as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock], {
    hasher: {
      update: (message) => {
        keccak.update(Buffer.from(new Uint8Array(message)));
      },
      digest: () => keccak.digest(),
    },
  });
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(messageGroup[0].message, p2pkhJson["PW_LOCK_[G1]"].MESSAGE);
});

test("seck256k1 [g1]", (t) => {
  const SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  let tx = txSkeletonFromJson(
    p2pkhJson["SECP256K1_[G1]"].tx as txObject,
    SIGNATURE_PLACEHOLDER
  );

  const signLock = p2pkhJson["SECP256K1_[G1]"].SIGN_LOCK as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock]);
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(messageGroup[0].message, p2pkhJson["SECP256K1_[G1]"].MESSAGE);
});

test("seck256k1 [g1, g1]", (t) => {
  const SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  let tx = txSkeletonFromJson(
    p2pkhJson["SECP256K1_[G1_G1]"].tx as txObject,
    SIGNATURE_PLACEHOLDER
  );

  const signLock = p2pkhJson["SECP256K1_[G1_G1]"].SIGN_LOCK as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock]);
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(messageGroup[0].message, p2pkhJson["SECP256K1_[G1_G1]"].MESSAGE);
});

test("doesn't fill witnesses beforehand", (t) => {
  let tx = txSkeletonFromJson(p2pkhJson["SECP256K1_[G1]"].tx as txObject);

  const signLock = p2pkhJson["SECP256K1_[G1]"].SIGN_LOCK as Script;

  const error = t.throws(() => createP2PKHMessageGroup(tx, [signLock]));

  t.is(error.message, "Please fill witnesses with 0 first!");
});
