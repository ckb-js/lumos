import { Uint128LE } from "./number/uint";
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
export const HashType = createFixedBytesCodec<string>({
  byteLength: 1,
  pack: (type) => {
    const data = new DataView(new ArrayBuffer(1));
    if (type === "data") {
      data.setUint8(0, 0);
    } else if (type === "type") {
      data.setUint8(0, 1);
    } else if (type === "data1") {
      data.setUint8(0, 2);
    } else {
      throw new Error(`invalid hash type: ${type}`);
    }
    return new Uint8Array(data.buffer);
  },
  unpack: (buf) => {
    const data = new DataView(buf.buffer).getUint8(0);
    if (data === 0) {
      return "data";
    } else if (data === 1) {
      return "type";
    } else if (data === 2) {
      return "data1";
    } else {
      throw new Error("invalid data");
    }
  },
});

export const DepType = createFixedBytesCodec<string>({
  byteLength: 1,
  pack: (type) => {
    const data = new DataView(new ArrayBuffer(1));
    if (type === "code") {
      data.setUint8(0, 0);
    } else if (type === "dep_group") {
      data.setUint8(0, 1);
    } else {
      throw new Error(`invalid hash type: ${type}`);
    }
    return new Uint8Array(data.buffer);
  },
  unpack: (buf) => {
    const data = new DataView(buf.buffer).getUint8(0);
    if (data === 0) {
      return "code";
    } else if (data === 1) {
      return "dep_group";
    } else {
      throw new Error("invalid data");
    }
  },
});

export const Script = table(
  {
    codeHash: Byte32,
    hashType: HashType,
    args: Bytes,
  },
  ["codeHash", "hashType", "args"]
);

export const ScriptOpt = option(Script);

export const OutPoint = struct(
  {
    txHash: Byte32,
    index: Uint32LE,
  },
  ["txHash", "index"]
);

export const CellInput = struct(
  {
    since: Uint64LE,
    previousOutput: OutPoint,
  },
  ["since", "previousOutput"]
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
    outPoint: OutPoint,
    depType: DepType,
  },
  ["outPoint", "depType"]
);

export const DeCellDepVec = vector(CellDep);

export const RawTransaction = table(
  {
    version: Uint32LE,
    cellDeps: DeCellDepVec,
    headerDeps: Byte32Vec,
    inputs: CellInputVec,
    outputs: CellOutputVec,
    outputsData: BytesVec,
  },
  ["version", "cellDeps", "headerDeps", "inputs", "outputs", "outputsData"]
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
    compactTarget: Uint32LE,
    timestamp: Uint64LE,
    number: Uint64LE,
    epoch: Uint64LE,
    parentHash: Byte32,
    transactionsRoot: Byte32,
    proposalsHash: Byte32,
    extraHash: Byte32,
    dao: Byte32,
  },
  [
    "version",
    "compactTarget",
    "timestamp",
    "number",
    "epoch",
    "parentHash",
    "transactionsRoot",
    "proposalsHash",
    "extraHash",
    "dao",
  ]
);

export const Header = struct(
  {
    raw: RawHeader,
    nonce: Uint128LE,
  },
  ["raw", "nonce"]
);

export const ProposalShortId = createFixedHexBytesCodec(10);

export const ProposalShortIdVec = vector(ProposalShortId);

export const UncleBlock = table(
  {
    header: Header,
    proposals: ProposalShortIdVec,
  },
  ["header", "proposals"]
);

export const UncleBlockVec = vector(UncleBlock);

export const Block = table(
  {
    header: Header,
    uncles: UncleBlockVec,
    transactions: TransactionVec,
    proposals: ProposalShortIdVec,
  },
  ["header", "uncles", "transactions", "proposals"]
);

export const BlockV1 = table(
  {
    header: Header,
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
