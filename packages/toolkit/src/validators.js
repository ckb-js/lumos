// This package provides validator functions that check JSON objects are
// following the correct format, so we can submit them to CKB via RPC
// directly

function assertObject(debugPath, object) {
  if (!(object instanceof Object)) {
    throw new Error(`${debugPath} is not an object!`);
  }
}

function assertObjectWithKeys(
  debugPath,
  object,
  expectedKeys,
  optionalKeys = []
) {
  assertObject(debugPath, object);
  const providedKeys = Object.keys(object).sort();
  const requiredLength = expectedKeys.length;
  const maximalLength = expectedKeys.length + optionalKeys.length;
  const errorMessage = `${debugPath} does not have correct keys! Required keys: [${expectedKeys
    .sort()
    .join(", ")}], optional keys: [${optionalKeys
    .sort()
    .join(", ")}], actual keys: [${providedKeys.join(", ")}]`;
  if (
    providedKeys.length < requiredLength ||
    providedKeys.length > maximalLength
  ) {
    throw new Error(errorMessage);
  }
  let optionalProvidedKeys = providedKeys.filter(
    key => !expectedKeys.includes(key)
  );
  if (providedKeys.length - optionalProvidedKeys.length !== requiredLength) {
    throw new Error(errorMessage);
  }
  if (optionalProvidedKeys.find(key => !optionalKeys.includes(key))) {
    throw new Error(errorMessage);
  }
}

function assertHexString(debugPath, string) {
  if (!/^0x([0-9a-fA-F][0-9a-fA-F])*$/.test(string)) {
    throw new Error(`${debugPath} must be a hex string!`);
  }
}

function assertHash(debugPath, hash) {
  assertHexString(debugPath, hash);
  if (hash.length !== 66) {
    throw new Error(`${debugPath} must be a hex string of 66 bytes long!`);
  }
}

function assertInteger(debugPath, i) {
  if (i === "0x0") {
    return;
  }
  if (!/^0x[1-9a-fA-F][0-9a-fA-F]*$/.test(i)) {
    throw new Error(`${debugPath} must be a hex integer!`);
  }
}

export function ValidateScript(
  script,
  { nestedValidation = true, debugPath = "script" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    script,
    ["code_hash", "hash_type", "args"],
    []
  );
  assertHash(`${debugPath}.code_hash`, script.code_hash);
  assertHexString(`${debugPath}.args`, script.args);

  if (
    script.hash_type !== "data" &&
    script.hash_type !== "type" &&
    script.hash_type !== "data1"
  ) {
    throw new Error(`${debugPath}.hash_type must be either data or type!`);
  }
}

export function ValidateOutPoint(
  outPoint,
  { nestedValidation = true, debugPath = "out_point" } = {}
) {
  assertObjectWithKeys(debugPath, outPoint, ["tx_hash", "index"], []);
  assertHash(`${debugPath}.tx_hash`, outPoint.tx_hash);
  assertInteger(`${debugPath}.index`, outPoint.index);
}

export function ValidateCellInput(
  cellInput,
  { nestedValidation = true, debugPath = "cell_input" } = {}
) {
  assertObjectWithKeys(debugPath, cellInput, ["since", "previous_output"], []);
  assertInteger(`${debugPath}.since`, cellInput.since);

  if (nestedValidation) {
    ValidateOutPoint(cellInput.previous_output, {
      debugPath: `${debugPath}.previous_output`
    });
  }
}

export function ValidateCellOutput(
  cellOutput,
  { nestedValidation = true, debugPath = "cell_output" } = {}
) {
  assertObjectWithKeys(debugPath, cellOutput, ["capacity", "lock"], ["type"]);
  assertInteger(`${debugPath}.capacity`, cellOutput.capacity);

  if (nestedValidation) {
    ValidateScript(cellOutput.lock, {
      debugPath: `${debugPath}.lock`
    });
    if (cellOutput.type) {
      ValidateScript(cellOutput.type, {
        debugPath: `${debugPath}.type`
      });
    }
  }
}

export function ValidateCellDep(
  cellDep,
  { nestedValidation = true, debugPath = "cell_dep" } = {}
) {
  assertObjectWithKeys(debugPath, cellDep, ["out_point", "dep_type"], []);
  if (cellDep.dep_type !== "code" && cellDep.dep_type !== "dep_group") {
    throw new Error(`${debugPath}.dep_type must be either code or dep_group!`);
  }

  if (nestedValidation) {
    ValidateOutPoint(cellDep.out_point, {
      debugPath: `${debugPath}.out_point`
    });
  }
}

function assertArray(debugPath, array, validateFunction, nestedValidation) {
  if (!Array.isArray(array)) {
    throw new Error(`${debugPath} is not an array!`);
  }
  if (nestedValidation) {
    for (let i = 0; i < array.length; i++) {
      validateFunction(`${debugPath}[${i}]`, array[i]);
    }
  }
}

function toAssert(validateFunction, nestedValidation) {
  return function(debugPath, value) {
    validateFunction(value, {
      nestedValidation: nestedValidation,
      debugPath: debugPath
    });
  };
}

function assertCommonTransaction(debugPath, rawTransaction, nestedValidation) {
  assertInteger(`${debugPath}.version`, rawTransaction.version);
  assertArray(
    `${debugPath}.cell_deps`,
    rawTransaction.cell_deps,
    toAssert(ValidateCellDep, nestedValidation),
    nestedValidation
  );
  assertArray(
    `${debugPath}.header_deps`,
    rawTransaction.header_deps,
    assertHash,
    nestedValidation
  );
  assertArray(
    `${debugPath}.inputs`,
    rawTransaction.inputs,
    toAssert(ValidateCellInput, nestedValidation),
    nestedValidation
  );
  assertArray(
    `${debugPath}.outputs`,
    rawTransaction.outputs,
    toAssert(ValidateCellOutput, nestedValidation),
    nestedValidation
  );
  assertArray(
    `${debugPath}.outputs_data`,
    rawTransaction.outputs_data,
    assertHexString,
    nestedValidation
  );
}

export function ValidateRawTransaction(
  rawTransaction,
  { nestedValidation = true, debugPath = "raw_transaction" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    rawTransaction,
    [
      "version",
      "cell_deps",
      "header_deps",
      "inputs",
      "outputs",
      "outputs_data"
    ],
    []
  );
  assertCommonTransaction(debugPath, rawTransaction, nestedValidation);
}

export function ValidateTransaction(
  transaction,
  { nestedValidation = true, debugPath = "transaction" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    transaction,
    [
      "version",
      "cell_deps",
      "header_deps",
      "inputs",
      "outputs",
      "outputs_data",
      "witnesses"
    ],
    []
  );
  assertCommonTransaction(debugPath, transaction, nestedValidation);
  assertArray(
    `${debugPath}.witnesses`,
    transaction.witnesses,
    assertHexString,
    nestedValidation
  );
}

function assertCommonHeader(debugPath, rawHeader) {
  assertInteger(`${debugPath}.version`, rawHeader.version);
  assertInteger(`${debugPath}.compact_target`, rawHeader.compact_target);
  assertInteger(`${debugPath}.timestamp`, rawHeader.timestamp);
  assertInteger(`${debugPath}.number`, rawHeader.number);
  assertInteger(`${debugPath}.epoch`, rawHeader.epoch);
  assertHash(`${debugPath}.parent_hash`, rawHeader.parent_hash);
  assertHash(`${debugPath}.transactions_root`, rawHeader.transactions_root);
  assertHash(`${debugPath}.proposals_hash`, rawHeader.proposals_hash);
  assertHash(`${debugPath}.extra_hash`, rawHeader.extra_hash);
  assertHash(`${debugPath}.dao`, rawHeader.dao);
}

export function ValidateRawHeader(
  rawHeader,
  { nestedValidation = true, debugPath = "raw_header" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    rawHeader,
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
      "dao"
    ],
    []
  );
  assertCommonHeader(debugPath, rawHeader);
}

export function ValidateHeader(
  header,
  { nestedValidation = true, debugPath = "header" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    header,
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
      "nonce"
    ],
    []
  );
  assertHexString(`${debugPath}.nonce`, header.nonce);
  if (header.nonce.length !== 34) {
    throw new Error(
      `${debugPath}.nonce must be a hex string of 34 bytes long!`
    );
  }
}

function assertProposalShortId(debugPath, shortId) {
  assertHexString(debugPath, shortId);
  if (shortId.length !== 22) {
    throw new Error(`${debugPath} must be a hex string of 22 bytes long!`);
  }
}

export function ValidateUncleBlock(
  uncleBlock,
  { nestedValidation = true, debugPath = "uncle_block" } = {}
) {
  assertObjectWithKeys(debugPath, uncleBlock, ["header", "proposals"], []);

  if (nestedValidation) {
    ValidateHeader(uncleBlock.header, {
      debugPath: `${debugPath}.header`
    });
  }
  assertArray(
    `${debugPath}.proposals`,
    uncleBlock.proposals,
    assertProposalShortId,
    nestedValidation
  );
}

export function ValidateBlock(
  block,
  { nestedValidation = true, debugPath = "block" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    block,
    ["header", "uncles", "transactions", "proposals"],
    []
  );

  if (nestedValidation) {
    ValidateHeader(block.header, {
      debugPath: `${debugPath}.header`
    });
  }
  assertArray(
    `${debugPath}.uncles`,
    block.uncles,
    toAssert(ValidateUncleBlock, nestedValidation),
    nestedValidation
  );
  assertArray(
    `${debugPath}.transactions`,
    block.transactions,
    toAssert(ValidateTransaction, nestedValidation),
    nestedValidation
  );
  assertArray(
    `${debugPath}.proposals`,
    block.proposals,
    assertProposalShortId,
    nestedValidation
  );
}

export function ValidateCellbaseWitness(
  cellbaseWitness,
  { nestedValidation = true, debugPath = "cellbase_witness" } = {}
) {
  assertObjectWithKeys(debugPath, cellbaseWitness, ["lock", "message"], []);
  assertHexString(`${debugPath}.message`, cellbaseWitness.message);

  if (nestedValidation) {
    ValidateScript(cellbaseWitness.lock, {
      debugPath: `${debugPath}.lock`
    });
  }
}

export function ValidateWitnessArgs(
  witnessArgs,
  { nestedValidation = true, debugPath = "witness_args" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    witnessArgs,
    [],
    ["lock", "input_type", "output_type"]
  );

  if (witnessArgs.lock) {
    assertHexString(`${debugPath}.lock`, witnessArgs.lock);
  }
  if (witnessArgs.input_type) {
    assertHexString(`${debugPath}.input_type`, witnessArgs.input_type);
  }
  if (witnessArgs.output_type) {
    assertHexString(`${debugPath}.output_type`, witnessArgs.output_type);
  }
}
