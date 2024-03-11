import { createFixedBytesCodec, number } from "@ckb-lumos/codec";

const { Uint32, Uint64, Uint128 } = number;

/**
 * <pre>
 *  0b0000000 0
 *    ───┬─── │
 *       │    ▼
 *       │   type - the last bit indicates locating contract(script) via type hash and runs in the latest version of the CKB-VM
 *       │
 *       ▼
 * data* - the first 7 bits indicate locating contract(script) via code hash and runs in the specified version of the CKB-VM
 * </pre>
 *
 */
const HashType = createFixedBytesCodec<"data" | "type" | "data1" | "data2">({
  byteLength: 1,
  // prettier-ignore
  pack: (hashType) => {
    if (hashType === "type")  return new Uint8Array([0b0000000_1]);
    if (hashType === "data")  return new Uint8Array([0b0000000_0]);
    if (hashType === "data1") return new Uint8Array([0b0000001_0]);
    if (hashType === "data2") return new Uint8Array([0b0000010_0]);

    throw new Error('Unknown hash type')
  },
  unpack: (byte) => {
    if (byte[0] === 0b0000000_1) return "type";
    if (byte[0] === 0b0000000_0) return "data";
    if (byte[0] === 0b0000001_0) return "data1";
    if (byte[0] === 0b0000010_0) return "data2";

    throw new Error("Unknown hash type");
  },
});

const DepType = createFixedBytesCodec<"code" | "depGroup">({
  byteLength: 1,
  // prettier-ignore
  pack: (depType) => {
    if (depType === "code")     return new Uint8Array([0]);
    if (depType === "depGroup") return new Uint8Array([1]);

    throw new Error("Unknown dep type");
  },
  unpack: (byte) => {
    if (byte[0] === 0) return "code";
    if (byte[0] === 1) return "depGroup";

    throw new Error("Unknown dep type");
  },
});

export { Uint32, Uint64, Uint128, DepType, HashType };
