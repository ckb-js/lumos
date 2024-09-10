import test from "ava";
import { cellHelper, encodeToAddress, scriptHelper } from "../src";
import { randomBytes } from "@ckb-lumos/crypto";
import { bytes } from "@ckb-lumos/codec";
import { predefined } from "@ckb-lumos/config-manager";
import { defaultDeepClone } from "../src/models/base";
import { parseUnit } from "@ckb-lumos/bi";
import { Uint128 } from "@ckb-lumos/codec/lib/number";

test("deepClone", (t) => {
  const obj = {
    key1: undefined,
    key2: "string",
    key3: 1,
    key4: 1n,
    key5: true,
    key6: [1, 2, 3],
    key7: {
      key7_01: [3, 2, 1],
    },
  };
  t.deepEqual(defaultDeepClone(obj), obj);
});

test("scriptHelper", (t) => {
  const codeHash = randomBytes(32);

  const script = scriptHelper.create({
    codeHash,
    hashType: "type",
    args: "0x",
  });

  t.deepEqual(script, {
    codeHash: bytes.hexify(codeHash),
    hashType: "type",
    args: "0x",
  });

  const mainnetAddress = encodeToAddress(script);
  t.deepEqual(scriptHelper.create(mainnetAddress), script);

  const testnetAddress = encodeToAddress(script, {
    config: predefined.AGGRON4,
  });
  t.deepEqual(scriptHelper.create(testnetAddress), script);

  t.deepEqual(scriptHelper.clone(script), script);
});

test("cellHelper", (t) => {
  const cell = cellHelper.create({
    // fake secp256k1
    lock: {
      codeHash: randomBytes(32),
      hashType: "type",
      args: randomBytes(20),
    },
    // fake sudt
    type: {
      codeHash: randomBytes(32),
      hashType: "type",
      args: randomBytes(32),
    },
    data: Uint128.pack(0),
  });

  t.true(parseUnit("142", "ckb").eq(cell.cellOutput.capacity));
  t.deepEqual(cellHelper.create(cell), cell);
});
