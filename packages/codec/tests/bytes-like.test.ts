import test from "ava";
import { molecule, number } from "../src";
import { Byte32 } from "../src/blockchain";
import { randomBytes } from "crypto";
import { concat, hexify } from "../src/bytes";
import { BI } from "@ckb-lumos/bi";

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
