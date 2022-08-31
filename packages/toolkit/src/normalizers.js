// This package provides normalizer functions. Even though CKB uses molecule
// as the serialization layer. There is still CKB specific knowledge that does
// not belong in molecule. For example, all numbers in CKB protocols are
// serialized using little endian format. This package tries to encode such
// knowledge. The goal here, is that you are free to use whatever types that
// makes most sense to represent the values. As long as you pass your object
// through the normalizers here, molecule should be able to serialize the values
// into correct formats required by CKB.
//
// Note this is only used when you need to deal with CKB structures in molecule
// format. If you are using RPCs or GraphQL to interact with CKB, chances are you
// will not need this package.
import JSBI from "jsbi";
import { Reader } from "./reader";
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function normalizeHexNumber(length) {
  return function (debugPath, value) {
    if (!(value instanceof ArrayBuffer)) {
      let intValue = JSBI.BigInt(value).toString(16);
      if (intValue.length % 2 !== 0) {
        intValue = "0" + intValue;
      }
      if (intValue.length / 2 > length) {
        throw new Error(
          `${debugPath} is ${
            intValue.length / 2
          } bytes long, expected length is ${length}!`
        );
      }
      const view = new DataView(new ArrayBuffer(length));
      for (let i = 0; i < intValue.length / 2; i++) {
        const start = intValue.length - (i + 1) * 2;
        view.setUint8(i, parseInt(intValue.substr(start, 2), 16));
      }
      value = view.buffer;
    }
    if (value.byteLength < length) {
      const array = new Uint8Array(length);
      array.set(new Uint8Array(value), 0);
      value = array.buffer;
    }
    return value;
  };
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function normalizeRawData(length) {
  return function (debugPath, value) {
    value = new Reader(value).toArrayBuffer();
    if (length > 0 && value.byteLength !== length) {
      throw new Error(
        `${debugPath} has invalid length ${value.byteLength}, required: ${length}`
      );
    }
    return value;
  };
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function normalizeObject(debugPath, object, keys) {
  const result = {};

  for (const [key, f] of Object.entries(keys)) {
    const value = object[key];
    if (!value) {
      throw new Error(`${debugPath} is missing ${key}!`);
    }
    result[key] = f(`${debugPath}.${key}`, value);
  }
  return result;
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeScript(script, { debugPath = "script" } = {}) {
  return normalizeObject(debugPath, script, {
    codeHash: normalizeRawData(32),
    hashType: function (debugPath, value) {
      switch (value) {
        case "data":
          return 0;
        case "type":
          return 1;
        case "data1":
          return 2;
        case 0:
          return value;
        case 1:
          return value;
        case 2:
          return value;
        default:
          throw new Error(`${debugPath}.hashType has invalid value: ${value}`);
      }
    },
    args: normalizeRawData(-1),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeOutPoint(outPoint, { debugPath = "outPoint" } = {}) {
  return normalizeObject(debugPath, outPoint, {
    txHash: normalizeRawData(32),
    index: normalizeHexNumber(4),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function toNormalize(normalize) {
  return function (debugPath, value) {
    return normalize(value, {
      debugPath,
    });
  };
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeCellInput(
  cellInput,
  { debugPath = "cell_input" } = {}
) {
  return normalizeObject(debugPath, cellInput, {
    since: normalizeHexNumber(8),
    previousOutput: toNormalize(NormalizeOutPoint),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeCellOutput(
  cellOutput,
  { debugPath = "cellOutput" } = {}
) {
  const result = normalizeObject(debugPath, cellOutput, {
    capacity: normalizeHexNumber(8),
    lock: toNormalize(NormalizeScript),
  });
  if (cellOutput.type) {
    result.type_ = NormalizeScript(cellOutput.type, {
      debugPath: `${debugPath}.type`,
    });
  }
  return result;
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeCellDep(cellDep, { debugPath = "cell_dep" } = {}) {
  return normalizeObject(debugPath, cellDep, {
    outPoint: toNormalize(NormalizeOutPoint),
    depType: function (debugPath, value) {
      switch (value) {
        case "code":
          return 0;
        case "depGroup":
          return 1;
        case 0:
          return value;
        case 1:
          return value;
        default:
          throw new Error(`${debugPath}.depType has invalid value: ${value}`);
      }
    },
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
function toNormalizeArray(normalizeFunction) {
  return function (debugPath, array) {
    return array.map((item, i) => {
      return normalizeFunction(`${debugPath}[${i}]`, item);
    });
  };
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeRawTransaction(
  rawTransaction,
  { debugPath = "raw_transaction" } = {}
) {
  return normalizeObject(debugPath, rawTransaction, {
    version: normalizeHexNumber(4),
    cellDeps: toNormalizeArray(toNormalize(NormalizeCellDep)),
    headerDeps: toNormalizeArray(normalizeRawData(32)),
    inputs: toNormalizeArray(toNormalize(NormalizeCellInput)),
    outputs: toNormalizeArray(toNormalize(NormalizeCellOutput)),
    outputsData: toNormalizeArray(normalizeRawData(-1)),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeTransaction(
  transaction,
  { debugPath = "transaction" } = {}
) {
  const rawTransaction = NormalizeRawTransaction(transaction, {
    debugPath: `(raw)${debugPath}`,
  });
  const result = normalizeObject(debugPath, transaction, {
    witnesses: toNormalizeArray(normalizeRawData(-1)),
  });
  result.raw = rawTransaction;
  return result;
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeRawHeader(
  rawHeader,
  { debugPath = "raw_header" } = {}
) {
  return normalizeObject(debugPath, rawHeader, {
    version: normalizeHexNumber(4),
    compactTarget: normalizeHexNumber(4),
    timestamp: normalizeHexNumber(8),
    number: normalizeHexNumber(8),
    epoch: normalizeHexNumber(8),
    parentHash: normalizeRawData(32),
    transactionsRoot: normalizeRawData(32),
    proposalsHash: normalizeRawData(32),
    extraHash: normalizeRawData(32),
    dao: normalizeRawData(32),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeHeader(header, { debugPath = "header" } = {}) {
  const rawHeader = NormalizeRawHeader(header, {
    debugPath: `(raw)${debugPath}`,
  });
  const result = normalizeObject(debugPath, header, {
    nonce: normalizeHexNumber(16),
  });
  result.raw = rawHeader;
  return result;
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeUncleBlock(
  uncleBlock,
  { debugPath = "uncle_block" } = {}
) {
  return normalizeObject(debugPath, uncleBlock, {
    header: toNormalize(NormalizeHeader),
    proposals: toNormalizeArray(normalizeRawData(10)),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeBlock(block, { debugPath = "block" } = {}) {
  return normalizeObject(debugPath, block, {
    header: toNormalize(NormalizeHeader),
    uncles: toNormalizeArray(toNormalize(NormalizeUncleBlock)),
    transactions: toNormalizeArray(toNormalize(NormalizeTransaction)),
    proposals: toNormalizeArray(normalizeRawData(10)),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeCellbaseWitness(
  cellbaseWitness,
  { debugPath = "cellbase_witness" } = {}
) {
  return normalizeObject(debugPath, cellbaseWitness, {
    lock: toNormalize(NormalizeScript),
    message: normalizeRawData(-1),
  });
}
/**
 * @deprecated please follow the {@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19 migration-guide}
 */
export function NormalizeWitnessArgs(
  witnessArgs,
  { debugPath = "witness_args" } = {}
) {
  const result = {};
  if (witnessArgs.lock) {
    result.lock = normalizeRawData(-1)(`${debugPath}.lock`, witnessArgs.lock);
  }
  if (witnessArgs.inputType) {
    result.inputType = normalizeRawData(-1)(
      `${debugPath}.inputType`,
      witnessArgs.inputType
    );
  }
  if (witnessArgs.outputType) {
    result.outputType = normalizeRawData(-1)(
      `${debugPath}.outputType`,
      witnessArgs.outputType
    );
  }
  return result;
}
