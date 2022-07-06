import test from "ava";
import { Script, utils } from "@ckb-lumos/base";
import { Reader } from "@ckb-lumos/toolkit";
import { default as createKeccak } from "keccak";
import { createP2PKHMessageGroup } from "../src/p2pkh";
import { txObject, txSkeletonFromJson } from "./helper";
import p2pkhJson from "./p2pkh.json";

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
      hasherInstance: hasher,
      reset: () => new utils.CKBHasher(),
      update: (hasher, message) => hasher.update(message.buffer),
      digest: (hasher) => new Uint8Array(hasher.digestReader().toArrayBuffer()),
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
      hasherInstance: keccak,
      update: (keccak, message) => {
        keccak.update(Buffer.from(new Uint8Array(message)));
      },
      digest: (keccak) => keccak.digest(),
      reset: () => createKeccak("keccak256"),
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

test("seck256k1 [g1, g2], test createP2PKHMessageGroup by multiple locks", (t) => {
  const SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  let tx = txSkeletonFromJson(
    p2pkhJson["SECP256K1_[G1_G2]"].tx as txObject,
    SIGNATURE_PLACEHOLDER
  );

  const signLock = p2pkhJson["SECP256K1_[G1_G2]"].SIGN_LOCK as Script;
  const signLock2 = p2pkhJson["SECP256K1_[G1_G2]"].SIGN_LOCK_2 as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock, signLock2]);
  t.is(messageGroup.length, 2);
  t.is(messageGroup[0].index, 0);
  t.is(messageGroup[1].index, 1);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.deepEqual(messageGroup[1].lock, signLock2);
});

test("doesn't fill witnesses beforehand", (t) => {
  let tx = txSkeletonFromJson(p2pkhJson["SECP256K1_[G1]"].tx as txObject);

  const signLock = p2pkhJson["SECP256K1_[G1]"].SIGN_LOCK as Script;

  const error = t.throws(() => createP2PKHMessageGroup(tx, [signLock]));

  t.is(error.message, "Please fill witnesses with 0 first!");
});
