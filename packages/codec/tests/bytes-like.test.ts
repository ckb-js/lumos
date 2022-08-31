import test from "ava";
import { molecule, number } from "../src";
import { Byte32 } from "../src/blockchain";
import { randomBytes } from "crypto";
import { equal, concat, hexify } from "../src/bytes";
import { BI } from "@ckb-lumos/bi";
import { bytify } from "../lib/bytes";

const { struct } = molecule;
const { Uint32 } = number;

test("pack with BytesLike and BIish", (t) => {
  const OutPoint = struct({ tx_hash: Byte32, index: Uint32 }, [
    "tx_hash",
    "index",
  ]);

  const txHash = randomBytes(32);

  const packed1 = OutPoint.pack({ tx_hash: txHash, index: 0 });
  const packed2 = OutPoint.pack({ tx_hash: hexify(txHash), index: "0x0" });
  const packed3 = OutPoint.pack({ tx_hash: txHash, index: "0x0" });
  const packed4 = OutPoint.pack({ tx_hash: txHash, index: BI.from(0) });

  t.deepEqual(packed1, concat(txHash, "0x00000000"));
  t.deepEqual(packed1, packed2);
  t.deepEqual(packed2, packed3);
  t.deepEqual(packed3, packed4);
});

test("unpack with BytesLike", (t) => {
  const OutPoint = struct({ tx_hash: Byte32, index: Uint32 }, [
    "tx_hash",
    "index",
  ]);

  const txHash = randomBytes(32);
  const index = "0x00000000";

  const unpacked1 = OutPoint.unpack(concat(txHash, index));
  const unpacked2 = OutPoint.unpack(hexify(concat(txHash, index)));
  const unpacked3 = OutPoint.unpack(Array.from(concat(txHash, index)));

  t.deepEqual(unpacked1, { tx_hash: hexify(txHash), index: 0 });
  t.deepEqual(unpacked1, unpacked2);
  t.deepEqual(unpacked2, unpacked3);
});

test("compare BytesLike", (t) => {
  const aString = "0x0102030405060708090a0b0c0d0e0f";
  const bString = "0x0102030405060708090A0B0C0D0E0F";
  const cArray = [
    0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c,
    0x0d, 0x0e, 0x0f,
  ];
  t.truthy(equal(aString, bString));
  t.truthy(equal(aString, cArray));
  t.truthy(equal(aString, bytify(bString)));
  t.truthy(equal(bytify(aString), bString));
});
