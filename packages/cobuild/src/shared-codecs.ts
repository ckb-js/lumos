import { blockchain } from "@ckb-lumos/base";
import { bytes, number } from "@ckb-lumos/codec";
import { byteVecOf } from "@ckb-lumos/codec/lib/molecule";

export const Bytes = blockchain.Bytes;
export const Byte32 = blockchain.Byte32;
export const Uint32 = number.Uint32;
export const BytesVec = blockchain.BytesVec;
export const Transaction = blockchain.Transaction;
export const CellOutputVec = blockchain.CellOutputVec;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export const String = byteVecOf<string>({
  pack: (value) => textEncoder.encode(value),
  unpack: (value) => textDecoder.decode(bytes.bytify(value)),
});
