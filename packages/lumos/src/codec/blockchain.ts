export {
  // The `UintN` is used to store a `N` bits unsigned integer
  // as a byte array in little endian.
  Uint32,
  Uint64,
  Uint128,
  Uint256,
} from "@ckb-lumos/codec/lib/number";

export {
  /* Basic Types */
  Bytes,
  BytesOpt,
  BytesOptVec,
  BytesVec,
  Byte32Vec,
  /* Types for Chain */
  ScriptOpt,
  ProposalShortId,
  UncleBlockVec,
  TransactionVec,
  ProposalShortIdVec,
  CellDepVec,
  CellInputVec,
  CellOutputVec,
  Script,
  OutPoint,
  CellInput,
  CellOutput,
  CellDep,
  RawTransaction,
  Transaction,
  RawHeader,
  Header,
  UncleBlock,
  Block,
  BlockV1,
  CellbaseWitness,
  WitnessArgs,
} from "@ckb-lumos/base/lib/blockchain";
