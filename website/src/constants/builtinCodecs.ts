import { AnyCodec, number } from "@ckb-lumos/codec"
import { blockchain } from "@ckb-lumos/base"
import { CodecMap } from "@ckb-lumos/molecule"
import { BIish, BI } from "@ckb-lumos/bi/lib"
import numeral from "numeral"

function enhanceUnpackBIish(codec: AnyCodec, afterUnpack: (arg: BIish) => string) {
  return {
    ...codec,
    unpack: (packed: Uint8Array) => afterUnpack(codec.unpack(packed)),
  }
}

const humanizeBigInteger = (x: BIish) => numeral(BI.from(x).toString()).format("0,0")

/**
 * built-in re-writable codecs
 */
export const builtinCodecs: CodecMap = {
  Uint8: enhanceUnpackBIish(number.Uint8, humanizeBigInteger),
  Uint16: enhanceUnpackBIish(number.Uint16, humanizeBigInteger),
  Uint32: enhanceUnpackBIish(number.Uint32, humanizeBigInteger),
  Uint64: enhanceUnpackBIish(number.Uint64, humanizeBigInteger),
  Uint128: enhanceUnpackBIish(number.Uint128, humanizeBigInteger),
  Uint256: enhanceUnpackBIish(number.Uint256, humanizeBigInteger),
  Uint512: enhanceUnpackBIish(number.Uint512, humanizeBigInteger),
  Bytes: blockchain.Bytes,
  Byte32: blockchain.Byte32,
  BytesVec: blockchain.BytesVec,
  Byte32Vec: blockchain.Byte32Vec,
  BytesOpt: blockchain.BytesOpt,

  HashType: blockchain.HashType,
  DepType: blockchain.DepType,

}

/**
 * merge user tokens with primitive tokens
 * @param userTokens
 */
export const mergeBuiltinCodecs = (userCodecs: CodecMap): CodecMap => {
  return { ...builtinCodecs, ...userCodecs }
}
