"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WitnessArgs = exports.UncleBlockVec = exports.UncleBlock = exports.TransactionVec = exports.Transaction = exports.ScriptOpt = exports.Script = exports.RawTransaction = exports.RawHeader = exports.ProposalShortIdVec = exports.ProposalShortId = exports.OutPoint = exports.Header = exports.HashType = exports.DepType = exports.CellbaseWitness = exports.CellOutputVec = exports.CellOutput = exports.CellInputVec = exports.CellInput = exports.CellDepVec = exports.CellDep = exports.BytesVec = exports.BytesOpt = exports.Bytes = exports.Byte32Vec = exports.Byte32 = exports.BlockV1 = exports.Block = void 0;
exports.WitnessArgsOf = WitnessArgsOf;
exports.createFixedHexBytesCodec = createFixedHexBytesCodec;

var _codec = require("@ckb-lumos/codec");

const {
  Uint128LE,
  Uint8,
  Uint32LE,
  Uint64LE
} = _codec.number;
const {
  byteVecOf,
  option,
  table,
  vector,
  struct
} = _codec.molecule;
const {
  bytify,
  hexify
} = _codec.bytes;

function createFixedHexBytesCodec(byteLength) {
  return (0, _codec.createFixedBytesCodec)({
    byteLength,
    pack: hex => bytify(hex),
    unpack: buf => hexify(buf)
  });
}
/**
 * placeholder codec, generally used as a placeholder
 * ```
 * // for example, when some BytesOpt is not used, it will be filled with this codec
 * // option BytesOpt (Bytes);
 * const UnusedBytesOpt = UnknownOpt
 * ```
 */
// export const UnusedOpt = option(Unknown);
// vector Bytes <byte>


const Bytes = byteVecOf({
  pack: bytify,
  unpack: hexify
});
exports.Bytes = Bytes;
const BytesOpt = option(Bytes);
exports.BytesOpt = BytesOpt;
const BytesVec = vector(Bytes);
exports.BytesVec = BytesVec;
const Byte32 = createFixedHexBytesCodec(32);
exports.Byte32 = Byte32;
const Byte32Vec = vector(Byte32);
exports.Byte32Vec = Byte32Vec;

function WitnessArgsOf(payload) {
  return table({
    lock: option(byteVecOf(payload.lock)),
    inputType: option(byteVecOf(payload.inputType)),
    outputType: option(byteVecOf(payload.outputType))
  }, ["lock", "inputType", "outputType"]);
}

const HexifyCodec = (0, _codec.createBytesCodec)({
  pack: bytify,
  unpack: hexify
});
/**
 *
 * @example
 * ```ts
 * // secp256k1 lock witness
 * WitnessArgs.pack({ lock: '0x' + '00'.repeat(65) })
 * ```
 */

const WitnessArgs = WitnessArgsOf({
  lock: HexifyCodec,
  inputType: HexifyCodec,
  outputType: HexifyCodec
});
/**
 * Implementation of blockchain.mol
 * https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
 */

exports.WitnessArgs = WitnessArgs;
const HashType = (0, _codec.createFixedBytesCodec)({
  byteLength: 1,
  pack: type => {
    if (type === "data") return Uint8.pack(0);
    if (type === "type") return Uint8.pack(1);
    if (type === "data1") return Uint8.pack(2);
    throw new Error(`Invalid hash type: ${type}`);
  },
  unpack: buf => {
    const hashTypeBuf = Uint8.unpack(buf);
    if (hashTypeBuf === 0) return "data";
    if (hashTypeBuf === 1) return "type";
    if (hashTypeBuf === 2) return "data1";
    throw new Error(`Invalid hash type: ${hashTypeBuf}`);
  }
});
exports.HashType = HashType;
const DepType = (0, _codec.createFixedBytesCodec)({
  byteLength: 1,
  pack: type => {
    if (type === "code") return Uint8.pack(0);
    if (type === "depGroup") return Uint8.pack(1);
    throw new Error(`Invalid dep type: ${type}`);
  },
  unpack: buf => {
    const depTypeBuf = Uint8.unpack(buf);
    if (depTypeBuf === 0) return "code";
    if (depTypeBuf === 1) return "depGroup";
    throw new Error(`Invalid dep type: ${depTypeBuf}`);
  }
});
exports.DepType = DepType;
const Script = table({
  codeHash: Byte32,
  hashType: HashType,
  args: Bytes
}, ["codeHash", "hashType", "args"]);
exports.Script = Script;
const ScriptOpt = option(Script);
exports.ScriptOpt = ScriptOpt;
const OutPoint = struct({
  txHash: Byte32,
  index: Uint32LE
}, ["txHash", "index"]);
exports.OutPoint = OutPoint;
const CellInput = struct({
  since: Uint64LE,
  previousOutput: OutPoint
}, ["since", "previousOutput"]);
exports.CellInput = CellInput;
const CellInputVec = vector(CellInput);
exports.CellInputVec = CellInputVec;
const CellOutput = table({
  capacity: Uint64LE,
  lock: Script,
  type: ScriptOpt
}, ["capacity", "lock", "type"]);
exports.CellOutput = CellOutput;
const CellOutputVec = vector(CellOutput);
exports.CellOutputVec = CellOutputVec;
const CellDep = struct({
  outPoint: OutPoint,
  depType: DepType
}, ["outPoint", "depType"]);
exports.CellDep = CellDep;
const CellDepVec = vector(CellDep);
exports.CellDepVec = CellDepVec;
const RawTransaction = table({
  version: Uint32LE,
  cellDeps: CellDepVec,
  headerDeps: Byte32Vec,
  inputs: CellInputVec,
  outputs: CellOutputVec,
  outputsData: BytesVec
}, ["version", "cellDeps", "headerDeps", "inputs", "outputs", "outputsData"]);
exports.RawTransaction = RawTransaction;
const Transaction = table({
  raw: RawTransaction,
  witnesses: BytesVec
}, ["raw", "witnesses"]); // Transaction.pack({ raw: { 
//   version: '',
//   cellDeps: [],
//   headerDeps: [],
//   inputs: [],
//   outputs: [],
//   outputsData: [],
// }, witnesses: [] });

exports.Transaction = Transaction;
const TransactionVec = vector(Transaction);
exports.TransactionVec = TransactionVec;
const RawHeader = struct({
  version: Uint32LE,
  compactTarget: Uint32LE,
  timestamp: Uint64LE,
  number: Uint64LE,
  epoch: Uint64LE,
  parentHash: Byte32,
  transactionsRoot: Byte32,
  proposalsHash: Byte32,
  extraHash: Byte32,
  dao: Byte32
}, ["version", "compactTarget", "timestamp", "number", "epoch", "parentHash", "transactionsRoot", "proposalsHash", "extraHash", "dao"]);
exports.RawHeader = RawHeader;
const Header = struct({
  raw: RawHeader,
  nonce: Uint128LE
}, ["raw", "nonce"]);
exports.Header = Header;
const ProposalShortId = createFixedHexBytesCodec(10);
exports.ProposalShortId = ProposalShortId;
const ProposalShortIdVec = vector(ProposalShortId);
exports.ProposalShortIdVec = ProposalShortIdVec;
const UncleBlock = table({
  header: Header,
  proposals: ProposalShortIdVec
}, ["header", "proposals"]);
exports.UncleBlock = UncleBlock;
const UncleBlockVec = vector(UncleBlock);
exports.UncleBlockVec = UncleBlockVec;
const Block = table({
  header: Header,
  uncles: UncleBlockVec,
  transactions: TransactionVec,
  proposals: ProposalShortIdVec
}, ["header", "uncles", "transactions", "proposals"]);
exports.Block = Block;
const BlockV1 = table({
  header: Header,
  uncles: UncleBlockVec,
  transactions: TransactionVec,
  proposals: ProposalShortIdVec,
  extension: Bytes
}, ["header", "uncles", "transactions", "proposals", "extension"]);
exports.BlockV1 = BlockV1;
const CellbaseWitness = table({
  lock: Script,
  message: Bytes
}, ["lock", "message"]);
exports.CellbaseWitness = CellbaseWitness;
//# sourceMappingURL=blockchain.js.map