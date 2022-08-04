const test = require("ava");
const { bytes, number } = require("@ckb-lumos/codec");

const u128 = BigInt("1208925819614629174706177");
const u128le = "0x01000000000000000000010000000000";

test("BigInt:toBigUInt128LE", (t) => {
  t.true(bytes.equal(number.Uint128LE.pack(u128), u128le));
});

test("BigInt:toBigUInt128LE, to small", (t) => {
  t.throws(() => number.Uint128LE.pack(-1n));
  t.notThrows(() => number.Uint128LE.pack(0n));
});

test("BigInt:toBigUInt128LE, to big", (t) => {
  t.throws(() => number.Uint128LE.pack(2n ** 128n));
  t.notThrows(() => number.Uint128LE.pack(2n ** 128n - 1n));
});

test("BigInt:readBigUInt128LE", (t) => {
  t.is(number.Uint128LE.unpack(u128le).toBigInt(), u128);
});
