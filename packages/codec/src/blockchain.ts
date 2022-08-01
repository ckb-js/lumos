import { Uint128LE, Uint8 } from "./number/uint";
import {
  AnyCodec,
  BytesCodec,
  BytesLike,
  createBytesCodec,
  createFixedBytesCodec,
  FixedBytesCodec,
  PackParam,
  UnpackResult,
} from "./base";
import { bytify, hexify } from "./bytes";
import { byteVecOf, option, table, vector, struct } from "./molecule";
import { Uint32LE, Uint64LE } from "./number";

export type _HashType = "type" | "data" | "data1";
export type _DepType = "depGroup" | "code";

export function createFixedHexBytesCodec(
  byteLength: number
): FixedBytesCodec<string, BytesLike> {
  return createFixedBytesCodec({
    byteLength,
    pack: (hex) => bytify(hex),
    unpack: (buf) => hexify(buf),
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
export const Bytes = byteVecOf({ pack: bytify, unpack: hexify });

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
  inputType: InputTypeCodec;
  outputType: OutputTypeCodec;
}): BytesCodec<
  {
    lock?: UnpackResult<LockCodec>;
    inputType?: UnpackResult<InputTypeCodec>;
    outputType?: UnpackResult<OutputTypeCodec>;
  },
  {
    lock?: PackParam<LockCodec>;
    inputType?: PackParam<InputTypeCodec>;
    outputType?: PackParam<OutputTypeCodec>;
  }
> {
  return table(
    {
      lock: option(byteVecOf(payload.lock)),
      inputType: option(byteVecOf(payload.inputType)),
      outputType: option(byteVecOf(payload.outputType)),
    },
    ["lock", "inputType", "outputType"]
  );
}

const HexifyCodec = createBytesCodec<string, BytesLike>({
  pack: bytify,
  unpack: hexify,
});

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
  inputType: HexifyCodec,
  outputType: HexifyCodec,
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
    if (type === "depGroup") return Uint8.pack(1);
    throw new Error(`Invalid dep type: ${type}`);
  },
  unpack: (buf) => {
    const depTypeBuf = Uint8.unpack(buf);
    if (depTypeBuf === 0) return "code";
    if (depTypeBuf === 1) return "depGroup";
    throw new Error(`Invalid dep type: ${depTypeBuf}`);
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

export const CellDepVec = vector(CellDep);

export const RawTransaction = table(
  {
    version: Uint32LE,
    cellDeps: CellDepVec,
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
