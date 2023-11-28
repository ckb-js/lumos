import { struct, vector } from "@ckb-lumos/codec/molecule";
import { Byte32 } from "@ckb-lumos/base/blockchain";
import { createFixedBytesCodec } from "@ckb-lumos/codec";
import { Uint32 } from "@ckb-lumos/codec/number";
import { BI } from "@ckb-lumos/bi";

export const OutPoint = struct(
  {
    txHash: Byte32,
    index: createFixedBytesCodec({
      byteLength: 4,
      pack: (hex) => Uint32.pack(hex),
      unpack: (buf) => BI.from(Uint32.unpack(buf)).toHexString(),
    }),
  },
  ["txHash", "index"]
);

export const OutPointVec = vector(OutPoint);
