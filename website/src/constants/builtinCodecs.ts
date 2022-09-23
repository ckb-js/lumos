import { AnyCodec, number } from "@ckb-lumos/codec"
import { blockchain } from "@ckb-lumos/base"
import { CodecMap } from "@ckb-lumos/molecule"
import { BIish, BI } from "@ckb-lumos/bi/lib"
import numeral from "numeral"

function enhanceUnPackBIish(codec: AnyCodec, afterUnpack: (arg: BIish) => string) {
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
  Uint8: enhanceUnPackBIish(number.Uint8, humanizeBigInteger),
  Uint16: enhanceUnPackBIish(number.Uint16, humanizeBigInteger),
  Uint32: enhanceUnPackBIish(number.Uint32, humanizeBigInteger),
  Uint64: enhanceUnPackBIish(number.Uint64, humanizeBigInteger),
  Uint128: enhanceUnPackBIish(number.Uint128, humanizeBigInteger),
  Uint256: enhanceUnPackBIish(number.Uint256, humanizeBigInteger),
  Uint512: enhanceUnPackBIish(number.Uint512, humanizeBigInteger),
  Bytes: blockchain.Bytes,
  Byte32: blockchain.Byte32,
  BytesVec: blockchain.BytesVec,
  Byte32Vec: blockchain.Byte32Vec,
  BytesOpt: blockchain.BytesOpt,

  Block: blockchain.Block,
  BlockV1: blockchain.BlockV1,
  CellDep: blockchain.CellDep,
  CellDepVec: blockchain.CellDepVec,
  CellInput: blockchain.CellInput,
  CellInputVec: blockchain.CellInputVec,
  CellOutput: blockchain.CellOutput,
  CellOutputVec: blockchain.CellOutputVec,
  CellbaseWitness: blockchain.CellbaseWitness,
  DepType: blockchain.DepType,
  HashType: blockchain.HashType,
  Header: blockchain.Header,
  OutPoint: blockchain.OutPoint,
  ProposalShortId: blockchain.ProposalShortId,
  ProposalShortIdVec: blockchain.ProposalShortIdVec,
  RawHeader: blockchain.RawHeader,
  RawTransaction: blockchain.RawTransaction,
  Script: blockchain.Script,
  ScriptOpt: blockchain.ScriptOpt,
  Transaction: blockchain.Transaction,
  TransactionVec: blockchain.TransactionVec,
  UncleBlock: blockchain.UncleBlock,
  UncleBlockVec: blockchain.UncleBlockVec,
  WitnessArgs: blockchain.WitnessArgs,
}

/**
 * merge user tokens with primitive tokens
 * @param userTokens
 */
export const mergeBuiltinCodecs = (userCodecs: CodecMap): CodecMap => {
  return { ...builtinCodecs, ...userCodecs }
}
