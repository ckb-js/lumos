const test = require("ava");

const { readBigUInt128LE, toBigUInt128LE } = require("../src/utils");

const u128 = BigInt("1208925819614629174706177");
const u128le = "0x01000000000000000000010000000000";

test("BigInt:toBigUInt128LE", (t) => {
  t.is(toBigUInt128LE(u128), u128le);
});

test("BigInt:toBigUInt128LE, to small", (t) => {
  t.throws(() => toBigUInt128LE(-1n));
  t.notThrows(() => toBigUInt128LE(0n));
});

test("BigInt:toBigUInt128LE, to big", (t) => {
  t.throws(() => toBigUInt128LE(2n ** 128n));
  t.notThrows(() => toBigUInt128LE(2n ** 128n - 1n));
});

test("BigInt:readBigUInt128LE", (t) => {
  t.is(readBigUInt128LE(u128le), u128);
});
