const test = require("ava");
const { Reader } = require("ckb-js-toolkit");
const { JSBI } = require("../lib/primitive");

const {
  CKBHasher,
  ckbHash,

  toBigUInt64LE,
  readBigUInt64LE,
  readBigUInt128LE,
  toBigUInt128LE,

  toBigUInt64LECompatible,
  readBigUInt64LECompatible,
  readBigUInt128LECompatible,
  toBigUInt128LECompatible,
  computeScriptHash,
  hashCode,
  assertHexString,
  assertHexadecimal,
} = require("../lib/utils");

const message = "0x";
const messageDigest =
  "0x44f4c69744d5f8c55d642062949dcae49bc4e7ef43d388c5a12f42b5633d163e";

test("CKBHasher, hex", (t) => {
  const result = new CKBHasher().update(message).digestHex();
  t.is(result, messageDigest);
});

test("CKBHasher, reader", (t) => {
  const result = new CKBHasher().update(new Reader(message)).digestHex();
  t.is(result, messageDigest);
});

test("ckbHash", (t) => {
  const arrayBuffer = new Reader(message).toArrayBuffer();
  const result = ckbHash(arrayBuffer);
  t.is(result.serializeJson(), messageDigest);
});

const uint64 = 1965338n;
const uint64le = "0x1afd1d0000000000";

test("toBigUInt64LE", (t) => {
  t.is(toBigUInt64LE(uint64), uint64le);
});

test("readBigUInt64LE", (t) => {
  t.is(readBigUInt64LE(uint64le), uint64);
});

const u128 = BigInt("1208925819614629174706177");
const u128le = "0x01000000000000000000010000000000";

test("toBigUInt128LE", (t) => {
  t.is(toBigUInt128LE(u128), u128le);
});

test("toBigUInt128LE, to small", (t) => {
  t.throws(() => toBigUInt128LE(-1n));
  t.notThrows(() => toBigUInt128LE(0n));
});

test("toBigUInt128LE, to big", (t) => {
  t.throws(() => toBigUInt128LE(2n ** 128n));
  t.notThrows(() => toBigUInt128LE(2n ** 128n - 1n));
});

test("readBigUInt128LE", (t) => {
  t.is(readBigUInt128LE(u128le), u128);
});

const uint64Compatible = JSBI.BigInt(1965338);
const uint64leCompatible = "0x1afd1d0000000000";

test("toBigUInt64LECompatible", (t) => {
  t.is(toBigUInt64LECompatible(uint64Compatible), uint64leCompatible);
});

test("readBigUInt64LECompatible", (t) => {
  t.true(
    JSBI.equal(readBigUInt64LECompatible(uint64leCompatible), uint64Compatible)
  );
});
const u128Compatible = JSBI.BigInt("1208925819614629174706177");
const u128leCompatible = "0x01000000000000000000010000000000";

test("toBigUInt128LECompatible", (t) => {
  t.is(toBigUInt128LECompatible(u128Compatible), u128leCompatible);
});

test("toBigUInt128LECompatible, to small", (t) => {
  t.throws(() => toBigUInt128LECompatible(JSBI.unaryMinus(JSBI.BigInt(1))));
  t.notThrows(() => toBigUInt128LECompatible(JSBI.BigInt(0)));
});

test("toBigUInt128LECompatible, to big", (t) => {
  t.throws(() =>
    toBigUInt128LECompatible(
      JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128))
    )
  );
  t.notThrows(() =>
    toBigUInt128LECompatible(
      JSBI.subtract(
        JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(128)),
        JSBI.BigInt(1)
      )
    )
  );
});

test("readBigUInt128LECompatible", (t) => {
  t.true(
    JSBI.equal(readBigUInt128LECompatible(u128leCompatible), u128Compatible)
  );
});

const script = {
  code_hash:
    "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
  hash_type: "type",
  args: "0x36c329ed630d6ce750712a477543672adab57f4c",
};
const scriptHash =
  "0x1f2615a8dde4e28ca736ff763c2078aff990043f4cbf09eb4b3a58a140a0862d";

test("computeScriptHash", (t) => {
  t.is(computeScriptHash(script), scriptHash);
});

test("hashCode, should return same hash if same input", (t) => {
  const buffer = Buffer.from("1234ab", "hex");
  t.is(hashCode(buffer), hashCode(buffer));
});

test("assertHexString", (t) => {
  t.notThrows(() => assertHexString("", "0x"));
  t.notThrows(() => assertHexString("", "0x1234"));
  t.throws(() => assertHexString("", "1234"));
  t.throws(() => assertHexString("", "0x123"));
  t.throws(() => assertHexString("", "0x123h"));
});

test("assertHexadecimal", (t) => {
  t.notThrows(() => assertHexadecimal("", "0x0"));
  t.notThrows(() => assertHexadecimal("", "0x01"));
  t.notThrows(() => assertHexadecimal("", "0x12"));
  t.throws(() => assertHexadecimal("", "12"));
  t.throws(() => assertHexadecimal("", "1r"));
});
