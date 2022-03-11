import test from "ava";
import { BI } from "@ckb-lumos/bi";
import {
  Bytes,
  BytesOpt,
  createFixedHexBytesCodec,
  HexUint128,
  HexUint128BE,
  HexUint16BE,
  HexUint16LE,
  HexUint256,
  HexUint256BE,
  HexUint32BE,
  HexUint32LE,
  HexUint512,
  HexUint512BE,
  HexUint64,
  HexUint64BE,
  HexUint8,
  Uint128,
  Uint128BE,
  Uint16,
  Uint16BE,
  Uint16LE,
  Uint256,
  Uint256BE,
  Uint32BE,
  Uint32LE,
  Uint512,
  Uint512BE,
  Uint64,
  Uint64BE,
  Uint8,
  UnusedOpt,
} from "../src/common";
import { bytesToArrayBuffer, toArrayBuffer } from "../src/utils";
import { byteOf, byteVecOf } from "../src/base";
import { table } from "../src/layout";

test("test Uint8", (t) => {
  const num = 18; // 0x12
  const numStr = "0x12"; // 0x12
  const packed = Uint8.pack(num);
  const strPacked = HexUint8.pack(numStr);
  t.deepEqual(packed, bytesToArrayBuffer([0x12]));
  t.truthy(num === Uint8.unpack(packed));
  t.truthy(numStr === HexUint8.unpack(strPacked));
  t.throws(() => Uint8.pack(256));
  t.throws(() => Uint8.unpack(new ArrayBuffer(2)));
});

test("test Uint16", (t) => {
  const num = 4660; // 0x1234
  const packed = Uint16LE.pack(num);
  const packedBE = Uint16BE.pack(num);
  t.deepEqual(packed, bytesToArrayBuffer([0x34, 0x12]));
  t.deepEqual(packedBE, bytesToArrayBuffer([0x12, 0x34]));
  t.truthy(num === Uint16LE.unpack(packed));
  t.truthy(num === Uint16BE.unpack(packedBE));
  t.throws(() => Uint16LE.pack(-1));
  t.throws(() => Uint16LE.unpack(new ArrayBuffer(3)));
  t.throws(() => Uint16BE.pack(-1));
  t.throws(() => Uint16BE.unpack(new ArrayBuffer(3)));
});

test("test Uint16 Hex", (t) => {
  const num = "0x1234";
  const packed = HexUint16LE.pack(num);
  const packedBE = HexUint16BE.pack(num);
  t.deepEqual(packed, bytesToArrayBuffer([0x34, 0x12]));
  t.deepEqual(packedBE, bytesToArrayBuffer([0x12, 0x34]));
  t.truthy(num === HexUint16LE.unpack(packed));
  t.truthy(num === HexUint16BE.unpack(packedBE));
  t.throws(() => HexUint16LE.pack("0x123456789"));
  t.throws(() => HexUint16LE.unpack(new ArrayBuffer(3)));
  t.throws(() => HexUint16BE.pack("0x123456789"));
  t.throws(() => HexUint16BE.unpack(new ArrayBuffer(3)));
});

test("test Uint32", (t) => {
  const num = 305419896; // 0x12345678
  const packed = Uint32LE.pack(num);
  const packedBE = Uint32BE.pack(num);
  t.deepEqual(packed, bytesToArrayBuffer([0x78, 0x56, 0x34, 0x12]));
  t.deepEqual(packedBE, bytesToArrayBuffer([0x12, 0x34, 0x56, 0x78]));
  t.truthy(num === Uint32LE.unpack(packed));
  t.truthy(num === Uint32BE.unpack(packedBE));
  t.throws(() => Uint32LE.pack(-1));
  t.throws(() => Uint32LE.unpack(new ArrayBuffer(3)));
  t.throws(() => Uint32BE.pack(-1));
  t.throws(() => Uint32BE.unpack(new ArrayBuffer(3)));
});

test("test Uint32 Hex", (t) => {
  const num = "0x12345678";
  const packed = HexUint32LE.pack(num);
  const packedBE = HexUint32BE.pack(num);
  t.deepEqual(packed, bytesToArrayBuffer([0x78, 0x56, 0x34, 0x12]));
  t.deepEqual(packedBE, bytesToArrayBuffer([0x12, 0x34, 0x56, 0x78]));
  t.truthy(num === HexUint32LE.unpack(packed));
  t.truthy(num === HexUint32BE.unpack(packedBE));
  t.throws(() => HexUint32LE.pack("0x123456789"));
  t.throws(() => HexUint32LE.unpack(new ArrayBuffer(3)));
  t.throws(() => HexUint32BE.pack("0x123456789"));
  t.throws(() => HexUint32BE.unpack(new ArrayBuffer(3)));
});

test("test Uint64", (t) => {
  const num = BI.from("0xf1f2f3f4f5f6f7f8");
  const packedBE = Uint64BE.pack(num);
  const packedLE = Uint64.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1])
  );
  t.truthy(Uint64.unpack(packedLE).eq(num));
  t.truthy(Uint64BE.unpack(packedBE).eq(num));
  t.throws(() => Uint64.pack(BI.from("0x12345678901234567890")));
  t.throws(() => Uint64.unpack(new ArrayBuffer(3)));
  t.throws(() => Uint64BE.pack(BI.from("0x12345678901234567890")));
  t.throws(() => Uint64BE.unpack(new ArrayBuffer(3)));
});

test("test Uint64 hex", (t) => {
  const num = "0xf1f2f3f4f5f6f7f8";
  const packedBE = HexUint64BE.pack(num);
  const packedLE = HexUint64.pack(num);
  t.deepEqual(
    packedBE,
    bytesToArrayBuffer([0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1])
  );
  t.truthy(HexUint64.unpack(packedLE) === num);
  t.truthy(HexUint64BE.unpack(packedBE) === num);
  t.throws(() => HexUint64.pack("0x12345678901234567890"));
  t.throws(() => HexUint64.unpack(new ArrayBuffer(3)));
  t.throws(() => HexUint64BE.pack("0x12345678901234567890"));
  t.throws(() => HexUint64BE.unpack(new ArrayBuffer(3)));
});

test("test Uint128", (t) => {
  const num = BI.from("0xf1f2f3f4f5f6f7f8");
  const packedBE = Uint128BE.pack(num);
  const packedLE = Uint128.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00])
  );
  t.truthy(Uint128.unpack(packedLE).eq(num));
  t.truthy(Uint128BE.unpack(packedBE).eq(num));
});

test("test Uint128 hex", (t) => {
  const num = "0xf1f2f3f4f5f6f7f8";
  const packedBE = HexUint128BE.pack(num);
  const packedLE = HexUint128.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00])
  );
  t.truthy(HexUint128.unpack(packedLE) === num);
  t.truthy(HexUint128BE.unpack(packedBE) === num);
});

test("test Uint256", (t) => {
  const num = BI.from("0xf1f2f3f4f5f6f7f8");
  const packedBE = Uint256BE.pack(num);
  const packedLE = Uint256.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00])
  );
  t.truthy(Uint256.unpack(packedLE).eq(num));
  t.truthy(Uint256BE.unpack(packedBE).eq(num));
});

test("test Uint256 hex", (t) => {
  const num = "0xf1f2f3f4f5f6f7f8";
  const packedBE = HexUint256BE.pack(num);
  const packedLE = HexUint256.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00])
  );
  t.truthy(HexUint256.unpack(packedLE) === num);
  t.truthy(HexUint256BE.unpack(packedBE) === num);
});

test("test Uint512", (t) => {
  const num = BI.from("0xf1f2f3f4f5f6f7f8");
  const packedBE = Uint512BE.pack(num);
  const packedLE = Uint512.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00])
  );
  t.truthy(Uint512.unpack(packedLE).eq(num));
  t.truthy(Uint512BE.unpack(packedBE).eq(num));
});

test("test Uint512 hex", (t) => {
  const num = "0xf1f2f3f4f5f6f7f8";
  const packedBE = HexUint512BE.pack(num);
  const packedLE = HexUint512.pack(num);
  t.deepEqual(
    packedBE,
    // prettier-ignore
    bytesToArrayBuffer([0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7, 0xf8])
  );
  t.deepEqual(
    packedLE,
    // prettier-ignore
    bytesToArrayBuffer([0xf8, 0xf7, 0xf6, 0xf5, 0xf4, 0xf3, 0xf2, 0xf1, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00,
            0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00, 0x00, 0x0, 0x0, 0x00])
  );
  t.truthy(HexUint512.unpack(packedLE) === num);
  t.truthy(HexUint512BE.unpack(packedBE) === num);
});

test("test byteOf", (t) => {
  t.deepEqual(byteOf(Uint8).pack(1), bytesToArrayBuffer([1]));
  t.throws(() => byteOf(Uint16).pack(1));
});

test("test hex bytes", (t) => {
  const hexStr = "0x123456";
  const hexBytes = Bytes.pack(hexStr);
  t.deepEqual(
    hexBytes,
    bytesToArrayBuffer([0x03, 0x00, 0x00, 0x00, 0x12, 0x34, 0x56])
  );
  t.truthy(hexStr === Bytes.unpack(hexBytes));
});
test("test fixed hex bytes", (t) => {
  const hexStr = "0x123456";
  const hexBytes = createFixedHexBytesCodec(3).pack(hexStr);
  t.deepEqual(
    hexBytes,
    // prettier-ignore
    bytesToArrayBuffer([0x12, 0x34, 0x56])
  );
  t.truthy(hexStr === createFixedHexBytesCodec(3).unpack(hexBytes));
  t.throws(() => createFixedHexBytesCodec(4).pack(hexStr));
});

// test("test UTF8String", (t) => {
//   const str = "hello_world";
//   const hexBytes = RawString.pack(str);
//   t.deepEqual(
//     hexBytes,
//     // prettier-ignore      h    e     l    l    o   _   w    o    r    l   d
//     bytesToArrayBuffer([104, 101, 108, 108, 111, 95, 119, 111, 114, 108, 100])
//   );
//   t.truthy(str === RawString.unpack(hexBytes));
// });

test("a real world Omni Lock witness should work as expected", (t) => {
  const OmniLockWitnessLock = table(
    {
      signature: BytesOpt,
      rc_identity: UnusedOpt,
      preimage: UnusedOpt,
    },
    ["signature", "rc_identity", "preimage"]
  );

  // connect WitnessArgs bytes with OmniLock WitnessWitnessLock
  const OmniLockWitness = table(
    {
      // lock: BytesOpt,
      lock: byteVecOf(OmniLockWitnessLock),
      type_input: BytesOpt,
      type_output: BytesOpt,
    },
    ["lock", "type_input", "type_output"]
  );

  const packedWitness = OmniLockWitness.pack({
    // secp256k1 signature in CKB is 65 bytes
    lock: { signature: "0x" + "00".repeat(65) },
  });
  const omniLockWitnessPlaceholder = toArrayBuffer(
    // the hex is calculated by the following code
    // SerializeWitnessArgs({
    //   lock: SerializeRcLockWitnessLock({
    //     signature: toArrayBuffer("0x" + "00".repeat(65)),
    //   }),
    // })
    "0x690000001000000069000000690000005500000055000000100000005500000055000000410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  );

  t.is(omniLockWitnessPlaceholder.byteLength, 105);
  t.deepEqual(packedWitness, omniLockWitnessPlaceholder);
});
