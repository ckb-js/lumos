/* eslint-disable @typescript-eslint/no-unused-vars */
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
    (key) => !expectedKeys.includes(key)
  );
  if (providedKeys.length - optionalProvidedKeys.length !== requiredLength) {
    throw new Error(errorMessage);
  }
  if (optionalProvidedKeys.find((key) => !optionalKeys.includes(key))) {
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
    ["codeHash", "hashType", "args"],
    []
  );
  assertHash(`${debugPath}.codeHash`, script.codeHash);
  assertHexString(`${debugPath}.args`, script.args);

  if (
    script.hashType !== "data" &&
    script.hashType !== "type" &&
    script.hashType !== "data1"
  ) {
    throw new Error(`${debugPath}.hashType must be either data or type!`);
  }
}

export function ValidateOutPoint(
  outPoint,
  { nestedValidation = true, debugPath = "outPoint" } = {}
) {
  assertObjectWithKeys(debugPath, outPoint, ["txHash", "index"], []);
  assertHash(`${debugPath}.txHash`, outPoint.txHash);
  assertInteger(`${debugPath}.index`, outPoint.index);
}

export function ValidateCellInput(
  cellInput,
  { nestedValidation = true, debugPath = "cellInput" } = {}
) {
  assertObjectWithKeys(debugPath, cellInput, ["since", "previousOutput"], []);
  assertInteger(`${debugPath}.since`, cellInput.since);

  if (nestedValidation) {
    ValidateOutPoint(cellInput.previousOutput, {
      debugPath: `${debugPath}.previousOutput`,
    });
  }
}

export function ValidateCellOutput(
  cellOutput,
  { nestedValidation = true, debugPath = "cellOutput" } = {}
) {
  assertObjectWithKeys(debugPath, cellOutput, ["capacity", "lock"], ["type"]);
  assertInteger(`${debugPath}.capacity`, cellOutput.capacity);

  if (nestedValidation) {
    ValidateScript(cellOutput.lock, {
      debugPath: `${debugPath}.lock`,
    });
    if (cellOutput.type) {
      ValidateScript(cellOutput.type, {
        debugPath: `${debugPath}.type`,
      });
    }
  }
}

export function ValidateCellDep(
  cellDep,
  { nestedValidation = true, debugPath = "cellDep" } = {}
) {
  assertObjectWithKeys(debugPath, cellDep, ["outPoint", "depType"], []);
  if (cellDep.depType !== "code" && cellDep.depType !== "depGroup") {
    throw new Error(`${debugPath}.depType must be either code or depGroup!`);
  }

  if (nestedValidation) {
    ValidateOutPoint(cellDep.outPoint, {
      debugPath: `${debugPath}.outPoint`,
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
  return function (debugPath, value) {
    validateFunction(value, {
      nestedValidation: nestedValidation,
      debugPath: debugPath,
    });
  };
}

function assertCommonTransaction(debugPath, rawTransaction, nestedValidation) {
  assertInteger(`${debugPath}.version`, rawTransaction.version);
  assertArray(
    `${debugPath}.cellDeps`,
    rawTransaction.cellDeps,
    toAssert(ValidateCellDep, nestedValidation),
    nestedValidation
  );
  assertArray(
    `${debugPath}.headerDeps`,
    rawTransaction.headerDeps,
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
    `${debugPath}.outputsData`,
    rawTransaction.outputsData,
    assertHexString,
    nestedValidation
  );
}

export function ValidateRawTransaction(
  rawTransaction,
  { nestedValidation = true, debugPath = "rawTransaction" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    rawTransaction,
    [
      "version",
      "cellDeps",
      "headerDeps",
      "inputs",
      "outputs",
      "outputsData",
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
      "cellDeps",
      "headerDeps",
      "inputs",
      "outputs",
      "outputsData",
      "witnesses",
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
  assertInteger(`${debugPath}.compactTarget`, rawHeader.compactTarget);
  assertInteger(`${debugPath}.timestamp`, rawHeader.timestamp);
  assertInteger(`${debugPath}.number`, rawHeader.number);
  assertInteger(`${debugPath}.epoch`, rawHeader.epoch);
  assertHash(`${debugPath}.parentHash`, rawHeader.parentHash);
  assertHash(`${debugPath}.transactionsRoot`, rawHeader.transactionsRoot);
  assertHash(`${debugPath}.proposalsHash`, rawHeader.proposalsHash);
  assertHash(`${debugPath}.extraHash`, rawHeader.extraHash);
  assertHash(`${debugPath}.dao`, rawHeader.dao);
}

export function ValidateRawHeader(
  rawHeader,
  { nestedValidation = true, debugPath = "rawHeader" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    rawHeader,
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
      "compactTarget",
      "timestamp",
      "number",
      "epoch",
      "parentHash",
      "transactionsRoot",
      "proposalsHash",
      "extraHash",
      "dao",
      "nonce",
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
  { nestedValidation = true, debugPath = "uncleBlock" } = {}
) {
  assertObjectWithKeys(debugPath, uncleBlock, ["header", "proposals"], []);

  if (nestedValidation) {
    ValidateHeader(uncleBlock.header, {
      debugPath: `${debugPath}.header`,
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
      debugPath: `${debugPath}.header`,
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
  { nestedValidation = true, debugPath = "cellbaseWitness" } = {}
) {
  assertObjectWithKeys(debugPath, cellbaseWitness, ["lock", "message"], []);
  assertHexString(`${debugPath}.message`, cellbaseWitness.message);

  if (nestedValidation) {
    ValidateScript(cellbaseWitness.lock, {
      debugPath: `${debugPath}.lock`,
    });
  }
}

export function ValidateWitnessArgs(
  witnessArgs,
  { nestedValidation = true, debugPath = "witnessArgs" } = {}
) {
  assertObjectWithKeys(
    debugPath,
    witnessArgs,
    [],
    ["lock", "inputType", "outputType"]
  );

  if (witnessArgs.lock) {
    assertHexString(`${debugPath}.lock`, witnessArgs.lock);
  }
  if (witnessArgs.inputType) {
    assertHexString(`${debugPath}.inputType`, witnessArgs.inputType);
  }
  if (witnessArgs.outputType) {
    assertHexString(`${debugPath}.outputType`, witnessArgs.outputType);
  }
}
