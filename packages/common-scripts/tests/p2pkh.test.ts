import test from "ava";
import { Cell, core, Script, utils } from "@ckb-lumos/base";
import { TransactionSkeleton } from "@ckb-lumos/helpers";
import { Reader, normalizers } from "@ckb-lumos/toolkit";
import * as config from "@ckb-lumos/config-manager";
import { default as createKeccak } from "keccak";
import { createP2PKHMessageGroup } from "../src/p2pkh";
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
  let tx = TransactionSkeleton({});

  const inputCell: Cell = p2pkhJson["OMNI_LOCK_[G1]"].INPUTS as Cell;
  const outputCell: Cell[] = p2pkhJson["OMNI_LOCK_[G1]"].OUTPUTS as Cell[];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push(
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.OMNI_LOCK.TX_HASH,
          index: CONFIG.SCRIPTS.OMNI_LOCK.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.OMNI_LOCK.DEP_TYPE,
      },
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      }
    )
  );

  const SECP_SIGNATURE_PLACEHOLDER = new Reader("0x" + "00".repeat(85));
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new Reader(
    core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(tmpWitnessArgs))
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) =>
    witnesses.push(tmpWitness, tmpWitness)
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
  let tx = TransactionSkeleton({});

  const inputCell: Cell = p2pkhJson["PW_LOCK_[G1]"].INPUTS as Cell;
  const outputCell: Cell[] = p2pkhJson["PW_LOCK_[G1]"].OUTPUTS as Cell[];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push(
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.PW_LOCK.TX_HASH,
          index: CONFIG.SCRIPTS.PW_LOCK.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.PW_LOCK.DEP_TYPE,
      },
      {
        out_point: {
          tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
          index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
        },
        dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      }
    )
  );

  const SECP_SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new Reader(
    core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(tmpWitnessArgs))
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) => witnesses.push(tmpWitness));

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
  let tx = TransactionSkeleton({});

  const inputCell: Cell = p2pkhJson["SECP256K1_[G1]"].INPUTS as Cell;
  const outputCell: Cell[] = p2pkhJson["SECP256K1_[G1]"].OUTPUTS as Cell[];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      out_point: {
        tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
        index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
      },
      dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
    })
  );

  const SECP_SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new Reader(
    core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(tmpWitnessArgs))
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) => witnesses.push(tmpWitness));

  const signLock = p2pkhJson["SECP256K1_[G1]"].SIGN_LOCK as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock]);
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(messageGroup[0].message, p2pkhJson["SECP256K1_[G1]"].MESSAGE);
});

test("seck256k1 [g1, g1]", (t) => {
  let tx = TransactionSkeleton({});

  const inputCell: Cell[] = p2pkhJson["SECP256K1_[G1_G1]"].INPUTS as Cell[];
  const outputCell: Cell[] = p2pkhJson["SECP256K1_[G1_G1]"].OUTPUTS as Cell[];
  tx = tx.update("inputs", (inputs) => inputs.push(...inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      out_point: {
        tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
        index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
      },
      dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
    })
  );

  const SECP_SIGNATURE_PLACEHOLDER = "0x" + "00".repeat(65);
  const tmpWitnessArgs = { lock: SECP_SIGNATURE_PLACEHOLDER };
  const tmpWitness = new Reader(
    core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(tmpWitnessArgs))
  ).serializeJson();
  tx = tx.update("witnesses", (witnesses) =>
    witnesses.push(tmpWitness, tmpWitness)
  );

  const hasher = new utils.CKBHasher();
  const signLock = p2pkhJson["SECP256K1_[G1_G1]"].SIGN_LOCK as Script;

  const messageGroup = createP2PKHMessageGroup(tx, [signLock], {
    hasher: {
      update: (message) => hasher.update(message.buffer),
      digest: () => new Uint8Array(hasher.digestReader().toArrayBuffer()),
    },
  });
  t.is(messageGroup.length, 1);
  t.is(messageGroup[0].index, 0);
  t.deepEqual(messageGroup[0].lock, signLock);
  t.is(messageGroup[0].message, p2pkhJson["SECP256K1_[G1_G1]"].MESSAGE);
});

test("doesn't fill witnesses beforehand", (t) => {
  let tx = TransactionSkeleton({});

  const inputCell: Cell = p2pkhJson["SECP256K1_[G1]"].INPUTS as Cell;
  const outputCell: Cell[] = p2pkhJson["SECP256K1_[G1]"].OUTPUTS as Cell[];
  tx = tx.update("inputs", (inputs) => inputs.push(inputCell));
  tx = tx.update("outputs", (outputs) => outputs.push(...outputCell));

  tx = tx.update("cellDeps", (cellDeps) =>
    cellDeps.push({
      out_point: {
        tx_hash: CONFIG.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
        index: CONFIG.SCRIPTS.SECP256K1_BLAKE160.INDEX,
      },
      dep_type: CONFIG.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
    })
  );

  const signLock = p2pkhJson["SECP256K1_[G1]"].SIGN_LOCK as Script;

  const error = t.throws(() => createP2PKHMessageGroup(tx, [signLock]));

  t.is(error.message, "Please fill witnesses with 0 first!");
});
