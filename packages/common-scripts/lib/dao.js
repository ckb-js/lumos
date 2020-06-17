const { parseAddress } = require("@ckb-lumos/helpers");
const { getConfig } = require("@ckb-lumos/config-manager");
const { core, values, utils } = require("@ckb-lumos/types");
const { toBigUInt64LE } = utils;
const { normalizers, Reader, RPC } = require("ckb-js-toolkit");
const secp256k1Blake160 = require("./secp256k1_blake160");
const secp256k1Blake160Multisig = require("./secp256k1_blake160_multisig");

const DEPOSIT_DAO_DATA = "0x0000000000000000";
const DAO_LOCK_PERIOD_EPOCHS = BigInt(180);

async function deposit(
  txSkeleton,
  fromInfo,
  toAddress,
  amount,
  { config = undefined } = {}
) {
  config = config || getConfig();
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (!DAO_SCRIPT) {
    throw new Error("Provided config does not have DAO script setup!");
  }

  // check and add cellDep if not exists
  txSkeleton = _addDaoCellDep(txSkeleton, config);

  if (!toAddress) {
    throw new Error("You must provide a to address!");
  }

  const toScript = parseAddress(toAddress, { config });
  const daoTypeScript = {
    code_hash: DAO_SCRIPT.CODE_HASH,
    hash_type: DAO_SCRIPT.HASH_TYPE,
    args: "0x",
  };

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: "0x" + BigInt(amount).toString(16),
        lock: toScript,
        type: daoTypeScript,
      },
      data: DEPOSIT_DAO_DATA,
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

  if (typeof fromInfo === "string") {
    const fromScript = parseAddress(fromInfo, { config });
    // address
    if (_isSecp256k1Blake160(fromScript, config)) {
      txSkeleton = await secp256k1Blake160.injectCapacity(
        txSkeleton,
        outputIndex,
        fromInfo,
        { config }
      );
    } else if (_isSecp256k1Blake160Multisig(fromScript, config)) {
      txSkeleton = await secp256k1Blake160Multisig.injectCapacity(
        txSkeleton,
        outputIndex,
        fromInfo,
        { config }
      );
    }
  } else if (fromInfo) {
    txSkeleton = await secp256k1Blake160Multisig.injectCapacity(
      txSkeleton,
      outputIndex,
      fromInfo,
      { config }
    );
  }

  return txSkeleton;
}

async function* listDaoCells(
  cellProvider,
  fromAddress,
  cellType, // "deposit" or "withdraw"
  { config = undefined } = {}
) {
  config = config || getConfig();
  const fromScript = parseAddress(fromAddress, { config });
  const daoTypeScript = _daoTypeScript(config);
  let data = null;
  if (cellType === "deposit") {
    data = DEPOSIT_DAO_DATA;
  }
  const cellCollector = cellProvider.collector({
    lock: fromScript,
    type: daoTypeScript,
    data,
  });
  for await (const inputCell of cellCollector.collect()) {
    if (cellType === "withdraw" && inputCell.data === DEPOSIT_DAO_DATA) {
      continue;
    }

    yield inputCell;
  }
}

async function withdraw(
  txSkeleton,
  fromInput,
  fromInfo,
  { config = undefined } = {}
) {
  config = config || getConfig();
  _checkDaoScript(config);
  txSkeleton = _addDaoCellDep(txSkeleton, config);

  // check inputs.size == outputs.size
  if (txSkeleton.get("inputs").size !== txSkeleton.get("outputs").size) {
    throw new Error("Input size must equals to output size in txSkeleton!");
  }

  // TODO: check fromInput

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }
  const typeScript = fromInput.cell_output.type;
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (
    typeScript.code_hash !== DAO_SCRIPT.CODE_HASH ||
    typeScript.hash_type !== DAO_SCRIPT.HASH_TYPE ||
    fromInput.data !== DEPOSIT_DAO_DATA
  ) {
    throw new Error("fromInput is not a DAO deposit cell.");
  }

  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: fromInput.cell_output.capacity,
        lock: fromInput.cell_output.lock,
        type: fromInput.cell_output.type,
      },
      data: toBigUInt64LE(fromInput.block_number),
      out_point: null,
      block_hash: null,
    });
  });

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(fromInput);
  });

  // add an empty witness
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    return witnesses.push("0x");
  });

  // add header deps
  txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
    return headerDeps.push(fromInput.block_hash);
  });

  // fix inputs / outputs / witnesses
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push(
      {
        field: "inputs",
        index: txSkeleton.get("inputs").size - 1,
      },
      {
        field: "outputs",
        index: txSkeleton.get("outputs").size - 1,
      }
    );
  });

  // setup input cell
  const fromLockScript = fromInput.cell_output.lock;
  if (_isSecp256k1Blake160(fromLockScript, config)) {
    txSkeleton = await secp256k1Blake160.setupInputCell(
      txSkeleton,
      txSkeleton.get("inputs").size - 1,
      { config }
    );
  } else if (_isSecp256k1Blake160Multisig(fromLockScript, config)) {
    txSkeleton = secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      txSkeleton.get("inputs").size - 1,
      fromInfo || generateAddress(fromLockScript, { config }),
      { config }
    );
  }

  return txSkeleton;
}

// epoch: bigint
function parseEpoch(epoch) {
  return {
    length: (epoch >> BigInt(40)) & BigInt(0xffff),
    index: (epoch >> BigInt(24)) & BigInt(0xffff),
    number: epoch & BigInt(0xffffff),
  };
}

function epochSince({ length, index, number }) {
  return (
    (BigInt(0x20) << BigInt(56)) +
    (length << BigInt(40)) +
    (index << BigInt(24)) +
    number
  );
}

async function unlock(
  txSkeleton,
  depositInput,
  withdrawInput,
  toAddress,
  fromInfo,
  { config = undefined } = {}
) {
  config = config || getConfig();
  _checkDaoScript(config);
  txSkeleton = _addDaoCellDep(txSkeleton, config);

  const cellProvider = txSkeleton.get("cellProvider");
  if (!cellProvider) {
    throw new Error("Cell provider is missing!");
  }
  const rpc = new RPC(cellProvider.uri);

  const typeScript = depositInput.cell_output.type;
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (
    typeScript.code_hash !== DAO_SCRIPT.CODE_HASH ||
    typeScript.hash_type !== DAO_SCRIPT.HASH_TYPE ||
    depositInput.data !== DEPOSIT_DAO_DATA
  ) {
    throw new Error("depositInt is not a DAO deposit cell.");
  }

  const withdrawTypeScript = withdrawInput.cell_output.type;
  if (
    withdrawTypeScript.code_hash !== DAO_SCRIPT.CODE_HASH ||
    withdrawTypeScript.hash_type !== DAO_SCRIPT.HASH_TYPE ||
    withdrawInput.data === DEPOSIT_DAO_DATA
  ) {
    throw new Error("withdrawInput is not a DAO withdraw cell.");
  }

  // TODO: check depositInput and withdrawInput match

  // calculate since & capacity (interest)
  const depositBlockHeader = await rpc.get_header(depositInput.block_hash);
  const depositEpoch = parseEpoch(BigInt(depositBlockHeader.epoch));
  // const depositCapacity = BigInt(depositInput.cell_output.capacity)

  const withdrawBlockHeader = await rpc.get_header(withdrawInput.block_hash);
  const withdrawEpoch = parseEpoch(BigInt(withdrawBlockHeader.epoch));

  const withdrawFraction = withdrawEpoch.index * depositEpoch.length;
  const depositFraction = depositEpoch.index * withdrawEpoch.length;
  let depositedEpochs = withdrawEpoch.number - depositEpoch.number;
  if (withdrawFraction > depositFraction) {
    depositedEpochs += BigInt(1);
  }
  const lockEpochs =
    ((depositedEpochs + (DAO_LOCK_PERIOD_EPOCHS - BigInt(1))) /
      DAO_LOCK_PERIOD_EPOCHS) *
    DAO_LOCK_PERIOD_EPOCHS;
  const minimalSinceEpoch = {
    number: depositEpoch.number + lockEpochs,
    index: depositEpoch.index,
    length: depositEpoch.length,
  };
  const minimalSince = epochSince(minimalSinceEpoch);
  const outputCapacity = await rpc.calculate_dao_maximum_withdraw(
    depositInput.out_point,
    withdrawBlockHeader.hash
  );

  const toScript = parseAddress(toAddress, { config });
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.push({
      cell_output: {
        capacity: outputCapacity,
        lock: toScript,
        type: null,
      },
      data: "0x",
      out_point: null,
      block_hash: null,
    });
  });

  txSkeleton = txSkeleton.update("inputs", (inputs) => {
    return inputs.push(withdrawInput);
  });

  txSkeleton = txSkeleton.update("inputSinces", (inputSinces) => {
    return (inputSinces = inputSinces.set(
      txSkeleton.get("inputs").size - 1,
      "0x" + minimalSince.toString(16)
    ));
  });

  while (txSkeleton.get("witnesses").size < txSkeleton.get("inputs").size - 1) {
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.push("0x")
    );
  }

  // add header deps
  txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
    return headerDeps.push(depositInput.block_hash, withdrawInput.block_hash);
  });

  const depositHeaderDepIndex = txSkeleton.get("headerDeps").size - 2;

  // add an empty witness
  txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
    const witnessArgs = {
      input_type: toBigUInt64LE(depositHeaderDepIndex),
    };
    return witnesses.push(
      new Reader(
        core.SerializeWitnessArgs(normalizers.NormalizeWitnessArgs(witnessArgs))
      ).serializeJson()
    );
  });

  // fix inputs / outputs / witnesses
  txSkeleton = txSkeleton.update("fixedEntries", (fixedEntries) => {
    return fixedEntries.push(
      {
        field: "inputs",
        index: txSkeleton.get("inputs").size - 1,
      },
      {
        field: "outputs",
        index: txSkeleton.get("outputs").size - 1,
      },
      {
        field: "witnesses",
        index: txSkeleton.get("witnesses").size - 1,
      },
      {
        filed: "headerDeps",
        index: txSkeleton.get("headerDeps").size - 2,
      }
    );
  });

  // setup input cell
  const fromLockScript = withdrawInput.cell_output.lock;
  if (_isSecp256k1Blake160(fromLockScript, config)) {
    txSkeleton = await secp256k1Blake160.setupInputCell(
      txSkeleton,
      txSkeleton.get("inputs").size - 1,
      { config }
    );
  } else if (_isSecp256k1Blake160Multisig(fromLockScript, config)) {
    txSkeleton = secp256k1Blake160Multisig.setupInputCell(
      txSkeleton,
      txSkeleton.get("inputs").size - 1,
      fromInfo || generateAddress(fromLockScript, { config }),
      { config }
    );
  }

  return txSkeleton;
}

function _daoTypeScript(config) {
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  return {
    code_hash: DAO_SCRIPT.CODE_HASH,
    hash_type: DAO_SCRIPT.HASH_TYPE,
    args: "0x",
  };
}

function _checkDaoScript(config) {
  const DAO_SCRIPT = config.SCRIPTS.DAO;
  if (!DAO_SCRIPT) {
    throw new Error("Provided config does not have DAO script setup!");
  }
}

/**
 *
 * @param {TransactionSkeleton} txSkeleton
 * @param {any} config
 * @returns {TransactionSkeleton} txSkeleton
 */
function _addDaoCellDep(txSkeleton, config) {
  const template = config.SCRIPTS.DAO;
  return _addCellDep(txSkeleton, {
    out_point: {
      tx_hash: template.TX_HASH,
      index: template.INDEX,
    },
    dep_type: template.DEP_TYPE,
  });
}

function _addCellDep(txSkeleton, newCellDep) {
  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.dep_type === newCellDep.dep_type &&
      new values.OutPointValue(cellDep.out_point, { validate: false }).equals(
        new values.OutPointValue(newCellDep.out_point, { validate: false })
      )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: newCellDep.out_point,
        dep_type: newCellDep.dep_type,
      });
    });
  }

  return txSkeleton;
}

function _isSecp256k1Blake160(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160;

  return (
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

function _isSecp256k1Blake160Multisig(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;

  return (
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

module.exports = {
  deposit,
  listDaoCells,
  withdraw,
  unlock,
};
