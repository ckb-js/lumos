import { Uint128LE, Uint8 } from "./number/uint";
import {
  AnyCodec,
  BytesCodec,
  createBytesCodec,
  createFixedBytesCodec,
  FixedBytesCodec,
  UnpackResult,
} from "./base";
import { bytify, hexify } from "./bytes";
import { byteVecOf, option, table, vector, struct } from "./molecule";
import { Uint32LE, Uint64LE } from "./number";
import { BI } from "@ckb-lumos/bi";

export type _HashType = "type" | "data" | "data1";
export type _DepType = "dep_group" | "code";

export const createFixedHexBytesCodec = (
  byteLength: number
): FixedBytesCodec<string> =>
  createFixedBytesCodec<string>({
    byteLength,
    pack: (hex) => bytify(hex),
    unpack: (buf) => hexify(buf),
  });

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
export const Bytes = byteVecOf<string>({
  pack: (hex) => bytify(hex),
  unpack: (buf) => hexify(buf),
});

export const BytesOpt = option(Bytes);
export const BytesVec = vector(Bytes);
export const Byte32 = createFixedHexBytesCodec(32);
export const Byte32Vec = vector(Byte32);

export function WitnessArgsOf<
  LockCodec extends AnyCodec,
  InputTypeCodec extends AnyCodec,
  OutputTypeCodec extends AnyCodec
>(payload: {
  lock: LockCodec;
  input_type: InputTypeCodec;
  output_type: OutputTypeCodec;
}): BytesCodec<{
  lock?: UnpackResult<LockCodec>;
  input_type?: UnpackResult<InputTypeCodec>;
  output_type?: UnpackResult<OutputTypeCodec>;
}> {
  return table(
    {
      lock: option(byteVecOf(payload.lock)),
      input_type: option(byteVecOf(payload.input_type)),
      output_type: option(byteVecOf(payload.output_type)),
    },
    ["lock", "input_type", "output_type"]
  );
}

const HexifyCodec = createBytesCodec<string>({ pack: bytify, unpack: hexify });

/**
 *
 * @example
 * ```ts
 * // secp256k1 lock witness
 * WitnessArgs.pack({ lock: '0x' + '00'.repeat(65) })
 * ```
 */
export const WitnessArgs = WitnessArgsOf({
  lock: HexifyCodec,
  input_type: HexifyCodec,
  output_type: HexifyCodec,
});

/**
 * Implementation of blockchain.mol
 * https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
 */
export const HashType = createFixedBytesCodec<_HashType>({
  byteLength: 1,
  pack: (type) => {
    if (type === "data") return Uint8.pack(0);
    if (type === "type") return Uint8.pack(1);
    if (type === "data1") return Uint8.pack(2);
    throw new Error(`Invalid hash type: ${type}`);
  },
  unpack: (buf) => {
    const hashTypeBuf = Uint8.unpack(buf);
    if (hashTypeBuf === 0) return "data";
    if (hashTypeBuf === 1) return "type";
    if (hashTypeBuf === 2) return "data1";
    throw new Error(`Invalid hash type: ${hashTypeBuf}`);
  },
});

export const DepType = createFixedBytesCodec<_DepType>({
  byteLength: 1,
  pack: (type) => {
    if (type === "code") return Uint8.pack(0);
    if (type === "dep_group") return Uint8.pack(1);
    throw new Error(`Invalid dep type: ${type}`);
  },
  unpack: (buf) => {
    const depTypeBuf = Uint8.unpack(buf);
    if (depTypeBuf === 0) return "code";
    if (depTypeBuf === 1) return "dep_group";
    throw new Error(`Invalid dep type: ${depTypeBuf}`);
  },
});

export const Script = table(
  {
    code_hash: Byte32,
    hash_type: HashType,
    args: Bytes,
  },
  ["code_hash", "hash_type", "args"]
);

export const ScriptOpt = option(Script);

export const OutPoint = struct(
  {
    tx_hash: Byte32,
    index: Uint32LE,
  },
  ["tx_hash", "index"]
);

export const CellInput = struct(
  {
    since: Uint64LE,
    previous_output: OutPoint,
  },
  ["since", "previous_output"]
);

export const CellInputVec = vector(CellInput);

export const CellOutput = table(
  {
    capacity: Uint64LE,
    lock: Script,
    type: ScriptOpt,
  },
  ["capacity", "lock", "type"]
);

export const CellOutputVec = vector(CellOutput);

export const CellDep = struct(
  {
    out_point: OutPoint,
    dep_type: DepType,
  },
  ["out_point", "dep_type"]
);

export const DeCellDepVec = vector(CellDep);

export const RawTransaction = table(
  {
    version: Uint32LE,
    cell_deps: DeCellDepVec,
    header_deps: Byte32Vec,
    inputs: CellInputVec,
    outputs: CellOutputVec,
    outputs_data: BytesVec,
  },
  ["version", "cell_deps", "header_deps", "inputs", "outputs", "outputs_data"]
);

export const Transaction = table(
  {
    raw: RawTransaction,
    witnesses: BytesVec,
  },
  ["raw", "witnesses"]
);

export const TransactionVec = vector(Transaction);

export const RawHeader = struct(
  {
    version: Uint32LE,
    compact_target: Uint32LE,
    timestamp: Uint64LE,
    number: Uint64LE,
    epoch: Uint64LE,
    parent_hash: Byte32,
    transactions_root: Byte32,
    proposals_hash: Byte32,
    extra_hash: Byte32,
    dao: Byte32,
  },
  [
    "version",
    "compact_target",
    "timestamp",
    "number",
    "epoch",
    "parent_hash",
    "transactions_root",
    "proposals_hash",
    "extra_hash",
    "dao",
  ]
);

export const BaseHeader = struct(
  {
    raw: RawHeader,
    nonce: Uint128LE,
  },
  ["raw", "nonce"]
);

export interface _HeaderType {
  version: number;
  compact_target: number;
  timestamp: BI;
  number: BI;
  epoch: BI;
  dao: string;
  parent_hash: string;
  proposals_hash: string;
  transactions_root: string;
  uncles_hash: string;
  nonce: BI;
}

export const Header = createFixedBytesCodec<_HeaderType>({
  byteLength: 1,
  pack: (header) => {
    const normalizedHeader = {
      raw: {
        timestamp: header.timestamp,
        number: header.number,
        epoch: header.epoch,
        compact_target: header.compact_target,
        dao: header.dao,
        parent_hash: header.parent_hash,
        proposals_hash: header.proposals_hash,
        transactions_root: header.transactions_root,
        extra_hash: header.uncles_hash,
        version: header.version,
      },
      nonce: header.nonce,
    };
    return BaseHeader.pack(normalizedHeader);
  },
  unpack: (buf) => {
    const header = BaseHeader.unpack(buf);
    return {
      timestamp: header.raw.timestamp,
      number: header.raw.number,
      epoch: header.raw.epoch,
      compact_target: header.raw.compact_target,
      dao: header.raw.dao,
      parent_hash: header.raw.parent_hash,
      proposals_hash: header.raw.proposals_hash,
      transactions_root: header.raw.transactions_root,
      uncles_hash: header.raw.extra_hash,
      version: header.raw.version,
      nonce: header.nonce,
    };
  },
});

export const ProposalShortId = createFixedHexBytesCodec(10);

export const ProposalShortIdVec = vector(ProposalShortId);

export const UncleBlock = table(
  {
    header: BaseHeader,
    proposals: ProposalShortIdVec,
  },
  ["header", "proposals"]
);

export const UncleBlockVec = vector(UncleBlock);

export const Block = table(
  {
    header: BaseHeader,
    uncles: UncleBlockVec,
    transactions: TransactionVec,
    proposals: ProposalShortIdVec,
  },
  ["header", "uncles", "transactions", "proposals"]
);

export const BlockV1 = table(
  {
    header: BaseHeader,
    uncles: UncleBlockVec,
    transactions: TransactionVec,
    proposals: ProposalShortIdVec,
    extension: Bytes,
  },
  ["header", "uncles", "transactions", "proposals", "extension"]
);

export const CellbaseWitness = table(
  {
    lock: Script,
    message: Bytes,
  },
  ["lock", "message"]
);
