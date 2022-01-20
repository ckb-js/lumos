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
import { BigIntToHexString } from "./rpc";

function normalizeHexNumber(length) {
  return function (debugPath, value) {
    if (!(value instanceof ArrayBuffer)) {
      let intValue = BigIntToHexString(JSBI.BigInt(value)).substr(2);
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

export function NormalizeScript(script, { debugPath = "script" } = {}) {
  return normalizeObject(debugPath, script, {
    code_hash: normalizeRawData(32),
    hash_type: function (debugPath, value) {
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
          throw new Error(`${debugPath}.hash_type has invalid value: ${value}`);
      }
    },
    args: normalizeRawData(-1),
  });
}

export function NormalizeOutPoint(outPoint, { debugPath = "out_point" } = {}) {
  return normalizeObject(debugPath, outPoint, {
    tx_hash: normalizeRawData(32),
    index: normalizeHexNumber(4),
  });
}

function toNormalize(normalize) {
  return function (debugPath, value) {
    return normalize(value, {
      debugPath,
    });
  };
}

export function NormalizeCellInput(
  cellInput,
  { debugPath = "cell_input" } = {}
) {
  return normalizeObject(debugPath, cellInput, {
    since: normalizeHexNumber(8),
    previous_output: toNormalize(NormalizeOutPoint),
  });
}

export function NormalizeCellOutput(
  cellOutput,
  { debugPath = "cell_output" } = {}
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

export function NormalizeCellDep(cellDep, { debugPath = "cell_dep" } = {}) {
  return normalizeObject(debugPath, cellDep, {
    out_point: toNormalize(NormalizeOutPoint),
    dep_type: function (debugPath, value) {
      switch (value) {
        case "code":
          return 0;
        case "dep_group":
          return 1;
        case 0:
          return value;
        case 1:
          return value;
        default:
          throw new Error(`${debugPath}.dep_type has invalid value: ${value}`);
      }
    },
  });
}

function toNormalizeArray(normalizeFunction) {
  return function (debugPath, array) {
    return array.map((item, i) => {
      return normalizeFunction(`${debugPath}[${i}]`, item);
    });
  };
}

export function NormalizeRawTransaction(
  rawTransaction,
  { debugPath = "raw_transaction" } = {}
) {
  return normalizeObject(debugPath, rawTransaction, {
    version: normalizeHexNumber(4),
    cell_deps: toNormalizeArray(toNormalize(NormalizeCellDep)),
    header_deps: toNormalizeArray(normalizeRawData(32)),
    inputs: toNormalizeArray(toNormalize(NormalizeCellInput)),
    outputs: toNormalizeArray(toNormalize(NormalizeCellOutput)),
    outputs_data: toNormalizeArray(normalizeRawData(-1)),
  });
}

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

export function NormalizeRawHeader(
  rawHeader,
  { debugPath = "raw_header" } = {}
) {
  return normalizeObject(debugPath, rawHeader, {
    version: normalizeHexNumber(4),
    compact_target: normalizeHexNumber(4),
    timestamp: normalizeHexNumber(8),
    number: normalizeHexNumber(8),
    epoch: normalizeHexNumber(8),
    parent_hash: normalizeRawData(32),
    transactions_root: normalizeRawData(32),
    proposals_hash: normalizeRawData(32),
    extra_hash: normalizeRawData(32),
    dao: normalizeRawData(32),
  });
}

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

export function NormalizeUncleBlock(
  uncleBlock,
  { debugPath = "uncle_block" } = {}
) {
  return normalizeObject(debugPath, uncleBlock, {
    header: toNormalize(NormalizeHeader),
    proposals: toNormalizeArray(normalizeRawData(10)),
  });
}

export function NormalizeBlock(block, { debugPath = "block" } = {}) {
  return normalizeObject(debugPath, block, {
    header: toNormalize(NormalizeHeader),
    uncles: toNormalizeArray(toNormalize(NormalizeUncleBlock)),
    transactions: toNormalizeArray(toNormalize(NormalizeTransaction)),
    proposals: toNormalizeArray(normalizeRawData(10)),
  });
}

export function NormalizeCellbaseWitness(
  cellbaseWitness,
  { debugPath = "cellbase_witness" } = {}
) {
  return normalizeObject(debugPath, cellbaseWitness, {
    lock: toNormalize(NormalizeScript),
    message: normalizeRawData(-1),
  });
}

export function NormalizeWitnessArgs(
  witnessArgs,
  { debugPath = "witness_args" } = {}
) {
  const result = {};
  if (witnessArgs.lock) {
    result.lock = normalizeRawData(-1)(`${debugPath}.lock`, witnessArgs.lock);
  }
  if (witnessArgs.input_type) {
    result.input_type = normalizeRawData(-1)(
      `${debugPath}.input_type`,
      witnessArgs.input_type
    );
  }
  if (witnessArgs.output_type) {
    result.output_type = normalizeRawData(-1)(
      `${debugPath}.output_type`,
      witnessArgs.output_type
    );
  }
  return result;
}
