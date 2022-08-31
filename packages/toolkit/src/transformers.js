// This package provides transformer functions that transform JavaScript objects
// into JSON ready objects that can be passed to RPC. It following the following
// rules:
//
// 1. If the specified object has a serializeJson method, it would invoke this
// method and use the result to replace current object.
// 2. It then restricts the keys of the object to keys required by the specified
// entity(i.e., a Script would only have codeHash, hashType, args keys),for each
// sub-field, it then recursively perform the steps here from step 1.
// 3. It then optionally run validator functions to ensure the resulting object
// follows specified rules.
//
// Note rule 1 here provides the flexibility in defining your own structures: you
// could define a class containing custom data structures, then provide a
// serializeJson that transforms the custom one into the rigid data structure
// required by CKB. You can also leverage the Reader class we provide as much as
// possible. Since Reader class does provide serializeJson methods, transformers
// here will transform them to valid hex strings required by CKB.
import * as validators from "./validators";

function invokeSerializeJson(debugPath, value) {
  if (value instanceof Object && value.serializeJson instanceof Function) {
    return value.serializeJson.call(value);
  }
  return value;
}

function transformObject(debugPath, object, keys) {
  object = invokeSerializeJson(debugPath, object);
  if (!(object instanceof Object)) {
    throw new Error(`Transformed ${debugPath} is not an object!`);
  }
  const result = {};

  for (const [key, f] of Object.entries(keys)) {
    let value = object[key];
    if (!value) {
      const camelKey = key.replace(/(_[a-z])/g, (group) =>
        group.toUpperCase().replace("_", "")
      );
      value = object[camelKey];
    }
    if (value) {
      result[key] = f(`${debugPath}.${key}`, value);
    }
  }
  return result;
}
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformScript(
  script,
  { validation = true, debugPath = "script" } = {}
) {
  script = transformObject(debugPath, script, {
    codeHash: invokeSerializeJson,
    hashType: invokeSerializeJson,
    args: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateScript(script, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return script;
}
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformOutPoint(
  outPoint,
  { validation = true, debugPath = "outPoint" } = {}
) {
  outPoint = transformObject(debugPath, outPoint, {
    txHash: invokeSerializeJson,
    index: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateOutPoint(outPoint, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return outPoint;
}

function toInvoke(transform) {
  return function (debugPath, value) {
    return transform(value, {
      validation: false,
      debugPath,
    });
  };
}
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformCellInput(
  cellInput,
  { validation = true, debugPath = "cell_input" } = {}
) {
  cellInput = transformObject(debugPath, cellInput, {
    since: invokeSerializeJson,
    previousOutput: toInvoke(TransformOutPoint),
  });

  if (validation) {
    validators.ValidateCellInput(cellInput, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return cellInput;
}
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformCellOutput(
  cellOutput,
  { validation = true, debugPath = "cellOutput" } = {}
) {
  cellOutput = transformObject(debugPath, cellOutput, {
    capacity: invokeSerializeJson,
    lock: toInvoke(TransformScript),
    type: toInvoke(TransformScript),
  });

  if (validation) {
    validators.ValidateCellOutput(cellOutput, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return cellOutput;
}
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */ function TransformCellDep(
  cellDep,
  { validation = true, debugPath = "cell_dep" } = {}
) {
  cellDep = transformObject(debugPath, cellDep, {
    outPoint: toInvoke(TransformOutPoint),
    depType: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateCellDep(cellDep, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return cellDep;
}

function toInvokeArray(invokeFunction) {
  return function (debugPath, array) {
    return array.map((item, i) => {
      return invokeFunction(`${debugPath}[${i}]`, item);
    });
  };
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformRawTransaction(
  rawTransaction,
  { validation = true, debugPath = "raw_transaction" } = {}
) {
  rawTransaction = transformObject(debugPath, rawTransaction, {
    version: invokeSerializeJson,
    cellDeps: toInvokeArray(toInvoke(TransformCellDep)),
    headerDeps: toInvokeArray(invokeSerializeJson),
    inputs: toInvokeArray(toInvoke(TransformCellInput)),
    outputs: toInvokeArray(toInvoke(TransformCellOutput)),
    outputsData: toInvokeArray(invokeSerializeJson),
  });

  if (validation) {
    validators.ValidateRawTransaction(rawTransaction, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return rawTransaction;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformTransaction(
  transaction,
  { validation = true, debugPath = "transaction" } = {}
) {
  transaction = transformObject(debugPath, transaction, {
    version: invokeSerializeJson,
    cellDeps: toInvokeArray(toInvoke(TransformCellDep)),
    headerDeps: toInvokeArray(invokeSerializeJson),
    inputs: toInvokeArray(toInvoke(TransformCellInput)),
    outputs: toInvokeArray(toInvoke(TransformCellOutput)),
    outputsData: toInvokeArray(invokeSerializeJson),
    witnesses: toInvokeArray(invokeSerializeJson),
  });

  if (validation) {
    validators.ValidateTransaction(transaction, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return transaction;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformRawHeader(
  rawHeader,
  { validation = true, debugPath = "raw_header" } = {}
) {
  rawHeader = transformObject(debugPath, rawHeader, {
    version: invokeSerializeJson,
    compactTarget: invokeSerializeJson,
    timestamp: invokeSerializeJson,
    number: invokeSerializeJson,
    epoch: invokeSerializeJson,
    parentHash: invokeSerializeJson,
    transactionsRoot: invokeSerializeJson,
    proposalsHash: invokeSerializeJson,
    extraHash: invokeSerializeJson,
    dao: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateRawHeader(rawHeader, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return rawHeader;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformHeader(
  header,
  { validation = true, debugPath = "header" } = {}
) {
  header = transformObject(debugPath, header, {
    version: invokeSerializeJson,
    compactTarget: invokeSerializeJson,
    timestamp: invokeSerializeJson,
    number: invokeSerializeJson,
    epoch: invokeSerializeJson,
    parentHash: invokeSerializeJson,
    transactionsRoot: invokeSerializeJson,
    proposalsHash: invokeSerializeJson,
    extraHash: invokeSerializeJson,
    dao: invokeSerializeJson,
    nonce: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateHeader(header, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return header;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformUncleBlock(
  uncleBlock,
  { validation = true, debugPath = "uncle_block" } = {}
) {
  uncleBlock = transformObject(debugPath, uncleBlock, {
    header: toInvoke(TransformHeader),
    proposals: toInvokeArray(invokeSerializeJson),
  });

  if (validation) {
    validators.ValidateUncleBlock(uncleBlock, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return uncleBlock;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformBlock(
  block,
  { validation = true, debugPath = "block" } = {}
) {
  block = transformObject(debugPath, block, {
    header: toInvoke(TransformHeader),
    uncles: toInvokeArray(toInvoke(TransformUncleBlock)),
    transactions: toInvokeArray(toInvoke(TransformTransaction)),
    proposals: toInvokeArray(invokeSerializeJson),
  });

  if (validation) {
    validators.ValidateBlock(block, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return block;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformCellbaseWitness(
  cellbaseWitness,
  { validation = true, debugPath = "cellbase_witness" } = {}
) {
  cellbaseWitness = transformObject(debugPath, cellbaseWitness, {
    lock: toInvoke(TransformScript),
    message: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateCellbaseWitness(cellbaseWitness, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return cellbaseWitness;
}

/**
 * @deprecated please follow the [migration-guide]{@link https://lumos-website.vercel.app/migrations/migrate-to-v0.19}
 */
export function TransformWitnessArgs(
  witnessArgs,
  { validation = true, debugPath = "witness_args" } = {}
) {
  witnessArgs = transformObject(debugPath, witnessArgs, {
    lock: invokeSerializeJson,
    inputType: invokeSerializeJson,
    outputType: invokeSerializeJson,
  });

  if (validation) {
    validators.ValidateWitnessArgs(witnessArgs, {
      debugPath: `(transformed) ${debugPath}`,
    });
  }
  return witnessArgs;
}
