const { addCellDep } = require("./helper");
const { utils } = require("@ckb-lumos/base");
const { toBigUInt128LE, readBigUInt64LE, computeScriptHash } = utils;
const {
  serializeMultisigScript,
  multisigArgs,
} = require("./secp256k1_blake160_multisig");

const common = require("./common");
const { parseAddress, minimalCellCapacity } = require("@ckb-lumos/helpers");
const { Set } = require("immutable");

async function createToken(
  txSkeleton,
  fromInfo,
  amount,
  capacity = 14200000000n,
  { config = undefined } = {}
) {
  config = config || getConfig();

  const SUDT_SCRIPT = config.SCRIPTS.SUDT;

  if (!SUDT_SCRIPT) {
    throw new Error("Provided config does not have SUDT script setup!");
  }

  txSkeleton = addCellDep(txSkeleton, {
    out_point: {
      tx_hash: SUDT_SCRIPT.TX_HASH,
      index: SUDT_SCRIPT.INDEX,
    },
    dep_type: SUDT_SCRIPT.DEP_TYPE,
  });

  const fromScript = _fromInfoToScript(fromInfo, config);

  const toScript = fromScript;

  const sudtTypeScript = {
    code_hash: SUDT_SCRIPT.CODE_HASH,
    hash_type: SUDT_SCRIPT.HASH_TYPE,
    args: computeScriptHash(fromScript),
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: "0x" + BigInt(capacity).toString(16),
        lock: toScript,
        type: sudtTypeScript,
      },
      data: toBigUInt128LE(amount),
      out_point: null,
      block_hash: null,
    });
  });

  const outputIndex = txSkeleton.get("outputs").size - 1;

  // fix entry
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push({
      field: "outputs",
      index: outputIndex,
    });
  });

  txSkeleton = await common.injectCapacity(txSkeleton, outputIndex, fromInfo, {
    config,
  });

  return txSkeleton;
}

async function transfer(
  txSkeleton,
  fromInfo,
  sudtToken,
  toAddress,
  amount,
  capacity = 14200000000n,
  { config = undefined, queryOptions = {} } = {}
) {
  config = config || getConfig();

  const SUDT_SCRIPT = config.SCRIPTS.SUDT;

  if (!SUDT_SCRIPT) {
    throw new Error("Provided config does not have SUDT script setup!");
  }

  if (!toAddress) {
    throw new Error("You must provide a to address!");
  }
  const toScript = parseAddress(toAddress, { config });

  const fromScript = _fromInfoToScript(fromInfo, config);

  capacity = BigInt(capacity);
  amount = BigInt(amount);
  if (amount <= 0n) {
    throw new Error("amount must be greater than 0");
  }

  const sudtType = _generateSudtScript(sudtToken, config);

  // collect cells with which includes sUDT info
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: "0x" + capacity.toString(16),
        lock: toScript,
        type: sudtType,
      },
      data: toBigUInt128LE(amount),
      out_point: null,
      block_hash: null,
    });
  });

  txSkeleton = addCellDep(txSkeleton, {
    out_point: {
      tx_hash: SUDT_SCRIPT.TX_HASH,
      index: SUDT_SCRIPT.INDEX,
    },
    dep_type: SUDT_SCRIPT.DEP_TYPE,
  });

  // collect cells
  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }
  const cellCollector = cellProvider.collector({
    lock: fromScript,
    type: sudtType,
    data: null,
    argsLen: queryOptions.argsLen == null ? -1 : queryOptions.argsLen,
  });
  const changeCell = {
    cell_output: {
      capacity: "0x0",
      lock: fromScript,
      type: sudtType,
    },
    data: toBigUInt128LE(0n),
    out_point: null,
    block_hash: null,
  };
  let changeCapacity = BigInt(0);
  let changeAmount = BigInt(0);
  let previousInputs = Set();
  for (const input of txSkeleton.get("inputs")) {
    previousInputs = previousInputs.add(
      `${input.out_point.tx_hash}_${input.out_point.index}`
    );
  }
  for await (const inputCell of cellCollector.collect()) {
    // skip inputs already exists in txSkeleton.inputs
    if (
      previousInputs.has(
        `${inputCell.out_point.tx_hash}_${inputCell.out_point.index}`
      )
    ) {
      continue;
    }
    txSkeleton = txSkeleton.update("inputs", (inputs) =>
      inputs.push(inputCell)
    );
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.push("0x")
    );
    txSkeleton = await common.setupInputCell(
      txSkeleton,
      txSkeleton.get("inputs").size - 1,
      fromInfo,
      { config }
    );
    const inputCapacity = BigInt(inputCell.cell_output.capacity);
    const inputAmount = readBigUInt64LE(inputCell.data);
    let deductCapacity = inputCapacity;
    let deductAmount = inputAmount;
    if (deductCapacity > capacity) {
      deductCapacity = capacity;
    }
    capacity -= deductCapacity;
    changeCapacity += inputCapacity - deductCapacity;
    if (deductAmount > amount) {
      deductAmount = amount;
    }
    amount -= deductAmount;
    changeAmount += inputAmount - deductAmount;
    if (
      capacity === 0n &&
      amount === 0n &&
      ((changeCapacity === 0n && changeAmount === 0n) ||
        (changeCapacity > minimalCellCapacity(changeCell) &&
          changeAmount >= 0n))
    ) {
      break;
    }
  }
  if (changeCapacity >= minimalCellCapacity(changeCell)) {
    changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
    changeCell.data = toBigUInt128LE(changeAmount);
    txSkeleton = txSkeleton.update("outputs", (outputs) =>
      outputs.push(changeCell)
    );
  } else if (
    changeAmount > 0n &&
    changeCapacity < minimalCellCapacity(changeCell)
  ) {
    throw new Error("Not enough capacity for change in from address!");
  }
  if (capacity > 0) {
    throw new Error("Not enough capacity in from address!");
  }
  if (amount > 0) {
    throw new Error("Not enough amount in from address!");
  }

  return txSkeleton;
}

function _generateSudtScript(token, config) {
  const SUDT_SCRIPT = config.SCRIPTS.SUDT;
  // TODO: check token is a valid hash
  return {
    code_hash: SUDT_SCRIPT.CODE_HASH,
    hash_type: SUDT_SCRIPT.HASH_TYPE,
    args: token,
  };
}

function _fromInfoToScript(fromInfo, config) {
  let fromScript;
  if (typeof fromInfo === "string") {
    // fromInfo is an address
    fromScript = parseAddress(fromInfo, { config });
  } else {
    const multisigScript = serializeMultisigScript(fromInfo);
    const fromScriptArgs = multisigArgs(multisigScript, fromInfo.since);
    fromScript = {
      code_hash: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.CODE_HASH,
      hash_type: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.HASH_TYPE,
      args: fromScriptArgs,
    };
  }

  return fromScript;
}

module.exports = {
  createToken,
  transfer,
};
