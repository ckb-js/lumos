import {
  AnyCodec,
  BytesLike,
  createBytesCodec,
  createFixedBytesCodec,
  PackParam,
  UnpackResult,
  number,
  molecule,
  bytes,
} from "@ckb-lumos/codec";
import { BytesCodec, FixedBytesCodec } from "@ckb-lumos/codec/lib/base";

import type * as api from "./api";
import { BI, BIish } from "@ckb-lumos/bi";

function asHexadecimal(
  codec: FixedBytesCodec<BI, BIish> | FixedBytesCodec<number, BIish>
): FixedBytesCodec<string, BIish> {
  return {
    ...codec,
    unpack: (value) => BI.from(codec.unpack(value)).toHexString(),
  };
}

const Uint8 = asHexadecimal(number.Uint8);
const Uint32LE = asHexadecimal(number.Uint32LE);
const Uint64LE = asHexadecimal(number.Uint64LE);
const Uint128LE = asHexadecimal(number.Uint128LE);

const { byteVecOf, option, table, vector, struct } = molecule;
const { bytify, hexify } = bytes;

type TransactionCodecType = PackParam<typeof BaseTransaction>;
type TransactionUnpackResultType = UnpackResult<typeof BaseTransaction>;
type RawTransactionUnpackResultType = UnpackResult<typeof RawTransaction>;
type HeaderCodecType = PackParam<typeof BaseHeader>;
type HeaderUnpackResultType = UnpackResult<typeof BaseHeader>;
type RawHeaderUnpackResultType = UnpackResult<typeof RawHeader>;

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
export const BytesOptVec = vector(BytesOpt);
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
 * <pre>
 *  0b0000000 0
 *    ───┬─── │
 *       │    ▼
 *       │   type - use the default vm version
 *       │
 *       ▼
 * data* - use a particular vm version
 * </pre>
 *
 * Implementation of blockchain.mol
 * https://github.com/nervosnetwork/ckb/blob/5a7efe7a0b720de79ff3761dc6e8424b8d5b22ea/util/types/schemas/blockchain.mol
 */
export const HashType = createFixedBytesCodec<api.HashType>({
  byteLength: 1,
  pack: (type) => {
    // prettier-ignore
    if (type === "type")  return number.Uint8.pack(0b0000000_1);
    // prettier-ignore
    if (type === "data")  return number.Uint8.pack(0b0000000_0);
    if (type === "data1") return number.Uint8.pack(0b0000001_0);
    if (type === "data2") return number.Uint8.pack(0b0000010_0);
    throw new Error(`Invalid hash type: ${type}`);
  },
  unpack: (buf) => {
    const hashTypeBuf = number.Uint8.unpack(buf);
    if (hashTypeBuf === 0b0000000_1) return "type";
    if (hashTypeBuf === 0b0000000_0) return "data";
    if (hashTypeBuf === 0b0000001_0) return "data1";
    if (hashTypeBuf === 0b0000010_0) return "data2";
    throw new Error(`Invalid hash type: ${hashTypeBuf}`);
  },
});

export const DepType = createFixedBytesCodec<api.DepType>({
  byteLength: 1,
  pack: (type) => {
    if (type === "code") return Uint8.pack(0);
    if (type === "depGroup") return Uint8.pack(1);
    throw new Error(`Invalid dep type: ${type}`);
  },
  unpack: (buf) => {
    const depTypeBuf = number.Uint8.unpack(buf);
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

const BaseTransaction = table(
  {
    raw: RawTransaction,
    witnesses: BytesVec,
  },
  ["raw", "witnesses"]
);

export const Transaction = createBytesCodec({
  pack: (tx: api.Transaction) =>
    BaseTransaction.pack(transformTransactionCodecType(tx)),
  unpack: (buf) => deTransformTransactionCodecType(BaseTransaction.unpack(buf)),
});

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

export const BaseHeader = struct(
  {
    raw: RawHeader,
    nonce: Uint128LE,
  },
  ["raw", "nonce"]
);

export const Header = createBytesCodec({
  pack: (header: api.Header) =>
    BaseHeader.pack(transformHeaderCodecType(header)),
  unpack: (buf) => deTransformHeaderCodecType(BaseHeader.unpack(buf)),
});

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

// TODO make an enhancer for number codecs
/**
 * from Transantion defined in  @ckb-lumos/base/lib/api.d.ts
 * ```
 * export interface Transaction {
 *  cellDeps: CellDep[];
 *  hash?: Hash;
 *  headerDeps: Hash[];
 *  inputs: Input[];
 *  outputs: Output[];
 *  outputsData: HexString[];
 *  version: HexNumber;
 *  witnesses: HexString[];
 *}
 * to :
 * interface TransactionCodecType {
 *   raw: {
 *     version: Uint32LE;
 *     cellDeps: DeCellDepVec;
 *     headerDeps: Byte32Vec;
 *     inputs: CellInputVec;
 *     outputs: CellOutputVec;
 *     outputsData: BytesVec;
 *   };
 *   witnesses: BytesVec;
 * }
 * ```
 * @param data Transantion defined in @ckb-lumos/base/lib/api.d.ts
 * @returns TransactionCodecType
 */
export function transformTransactionCodecType(
  data: api.Transaction
): TransactionCodecType {
  return {
    raw: {
      version: data.version,
      cellDeps: data.cellDeps,
      headerDeps: data.headerDeps,
      inputs: data.inputs,
      outputs: data.outputs,
      outputsData: data.outputsData,
    },
    witnesses: data.witnesses,
  };
}

export function deTransformTransactionCodecType(
  data: TransactionUnpackResultType
): RawTransactionUnpackResultType & { witnesses: string[] } {
  return {
    cellDeps: data.raw.cellDeps.map((cellDep) => {
      return {
        outPoint: {
          txHash: cellDep.outPoint.txHash,
          index: cellDep.outPoint.index,
        },
        depType: cellDep.depType,
      };
    }),
    headerDeps: data.raw.headerDeps,
    inputs: data.raw.inputs.map((input) => {
      return {
        previousOutput: {
          txHash: input.previousOutput.txHash,
          index: input.previousOutput.index,
        },
        since: input.since,
      };
    }),
    outputs: data.raw.outputs.map((output) => {
      return {
        capacity: output.capacity,
        lock: output.lock,
        type: output.type,
      };
    }),
    outputsData: data.raw.outputsData,
    version: data.raw.version,
    witnesses: data.witnesses,
  };
}

export function transformHeaderCodecType(data: api.Header): HeaderCodecType {
  return {
    raw: {
      timestamp: data.timestamp,
      number: data.number,
      epoch: data.epoch,
      compactTarget: Number(data.compactTarget),
      dao: data.dao,
      parentHash: data.parentHash,
      proposalsHash: data.proposalsHash,
      transactionsRoot: data.transactionsRoot,
      extraHash: data.extraHash,
      version: data.version,
    },
    nonce: data.nonce,
  };
}

export function deTransformHeaderCodecType(
  data: HeaderUnpackResultType
): RawHeaderUnpackResultType & { nonce: string; hash: string } {
  return {
    timestamp: data.raw.timestamp,
    number: data.raw.number,
    epoch: data.raw.epoch,
    compactTarget: data.raw.compactTarget,
    dao: data.raw.dao,
    parentHash: data.raw.parentHash,
    proposalsHash: data.raw.proposalsHash,
    transactionsRoot: data.raw.transactionsRoot,
    extraHash: data.raw.extraHash,
    version: data.raw.version,
    nonce: data.nonce,
    hash: "",
  };
}
