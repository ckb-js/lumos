const test = require("ava");
const { Reader } = require("ckb-js-toolkit");

const {
  CKBHasher,
  ckbHash,
  toBigUInt64LE,
  readBigUInt64LE,
  readBigUInt128LE,
  toBigUInt128LE,
  computeScriptHash,
  hashCode,
  assertHexString,
  assertHexadecimal,
  generateTypeIdScript,
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

const u128 = 1208925819614629174706177n;
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

test("test type id", (t) => {
  const input = {
    previous_output: {
      index: '0x0',
      tx_hash: '0x128b201cd1995efba3126d4431f837c34f7d2f6a29ed8968d2ebc39059add56a'
    },
    since: '0x0'
  }
  const typeIdScript = {
    args: '0xa803c9ed6c190fd780e64d885794933ab23da641e94ad1b9270ebac893a7cdcc',
    code_hash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
    hash_type: 'type',
  };
  t.deepEqual(generateTypeIdScript(input, "0x0"), typeIdScript);
});
