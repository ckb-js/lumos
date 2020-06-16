const {
  configs,
  parseAddress,
  minimalCellCapacity,
} = require("@ckb-lumos/helpers");
const { LINA } = configs;
const {
  setupInputCell: setupMultisigInputCell,
  serializeMultisigScript,
  multisigArgs,
} = require("./secp256k1_blake160_multisig");
const { setupInputCell } = require("./secp256k1_blake160");
const { calculateMaximumWithdraw, calculateUnlockSince } = require("./dao");
const { core, values, utils, since: sinceUtils } = require("@ckb-lumos/types");
const { toBigUInt64LE, readBigUInt64LE } = utils;
const { ScriptValue } = values;
const { normalizers, Reader, RPC } = require("ckb-js-toolkit");
const {
  addCellDep,
  generateDaoScript,
  isSecp256k1Blake160MultisigScript,
  isSecp256k1Blake160Script,
  isDaoScript,
} = require("./helper");
const {
  parseSince,
  parseEpoch,
  largerAbsoluteEpochSince,
  generateAbsoluteEpochSince,
  checkSinceValid,
} = sinceUtils;

async function* collectCells(cellProvider, fromScript, { config = LINA } = {}) {
  const rpc = new RPC(cellProvider.uri);

  if (isSecp256k1Blake160MultisigScript(fromScript, config)) {
    // TODO: slice args if multisig
    const cellCollector = cellProvider.collector({
      lock: fromScript,
      type: "empty",
      data: "0x",
    });

    for await (const inputCell of cellCollector.collect()) {
      const args = inputCell.cell_output.lock.args;
      const header = await rpc.get_header(inputCell.block_hash);
      if (args.length === 58) {
        const argsSince = _parseMultisigArgsSince(args);
        yield {
          cell: inputCell,
          maximumCapacity: inputCell.cell_output.capacity,
          since: argsSince, // bigint
          header,
        };
      }
    }
  }

  const daoCellCollector = cellProvider.collector({
    lock: fromScript,
    type: generateDaoScript(config),
    data: null,
  });

  // unlock dao, and fromScript can be multisig
  for await (const inputCell of daoCellCollector.collect()) {
    if (inputCell.data === "0x0000000000000000") {
      continue;
    }
    const transactionWithStatus = await rpc.get_transaction(
      inputCell.out_point.tx_hash
    );
    const withdrawBlockHash = transactionWithStatus.tx_status.block_hash;
    const transaction = transactionWithStatus.transaction;
    const depositOutPoint =
      transaction.inputs[+inputCell.out_point.index].previous_output;
    const depositBlockHash = (
      await rpc.get_transaction(depositOutPoint.tx_hash)
    ).tx_status.block_hash;
    const depositBlockHeader = await rpc.get_header(depositBlockHash);
    const withdrawBlockHeader = await rpc.get_header(withdrawBlockHash);
    let since = calculateUnlockSince(
      depositBlockHeader.epoch,
      withdrawBlockHeader.epoch
    );
    const maximumCapacity = calculateMaximumWithdraw(
      inputCell,
      depositBlockHeader.dao,
      withdrawBlockHeader.dao
    );
    const withdrawEpochValue = parseEpoch(withdrawBlockHeader.epoch);
    const fourEpochsLater = {
      number: withdrawEpochValue.number + BigInt(4),
      length: withdrawEpochValue.length,
      index: withdrawEpochValue.index,
    };
    since = largerAbsoluteEpochSince(
      since,
      generateAbsoluteEpochSince(fourEpochsLater)
    );

    // if multisig with locktime
    let header;
    const lock = inputCell.cell_output.lock;
    if (
      isSecp256k1Blake160MultisigScript(lock, config) &&
      lock.args.length === 58
    ) {
      const multisigSince = parseSince(_parseMultisigArgsSince(lock.args));
      if (
        !(
          multisigSince.relative === false &&
          multisigSince.type === "epochNumber"
        )
      ) {
        throw new Error(
          "Multisig since not an absolute-epoch-number since format!"
        );
      }
      since = largerAbsoluteEpochSince(
        since,
        _parseMultisigArgsSince(lock.args)
      );
      header = await rpc.get_header(inputCell.block_hash);
    }

    yield {
      cell: inputCell,
      maximumCapacity: maximumCapacity,
      since: since,
      depositBlockHash: depositBlockHeader.hash,
      withdrawBlockHash: withdrawBlockHeader.hash,
      header,
    };
  }
}

// TODO: add dao and default lock support
async function transfer(
  txSkeleton,
  fromInfo,
  toAddress,
  amount,
  tipHeader,
  { config = LINA, requireToAddress = true }
) {
  // fromScript can be secp256k1_blake160 / secp256k1_blake160_multisig
  let fromScript;
  let multisigScript;
  if (typeof fromInfo === "string") {
    // fromInfo is an address
    fromScript = parseAddress(fromInfo, { config });
  } else {
    multisigScript = serializeMultisigScript(fromInfo);
    const fromScriptArgs = multisigArgs(multisigScript, fromInfo.since);
    fromScript = {
      code_hash: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT.code_hash,
      hash_type: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT.hash_type,
      args: fromScriptArgs,
    };
  }

  // validate fromScript
  if (
    !isSecp256k1Blake160MultisigScript(fromScript, config) &&
    !isSecp256k1Blake160Script(fromScript, config)
  ) {
    throw new Error("fromInfo not supported!");
  }

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  amount = BigInt(amount || 0);
  if (toAddress) {
    const toScript = parseAddress(toAddress, { config });

    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push({
        cell_output: {
          capacity: "0x" + amount.toString(16),
          lock: toScript,
          type: null,
        },
        data: "0x",
        out_point: null,
        block_hash: null,
      });
    });
  }

  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && amount > 0; ++i) {
    const output = txSkeleton.get("outputs").get(i);
    if (
      new ScriptValue(output.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    ) {
      const cellCapacity = BigInt(output.cell_output.capacity);
      let deductCapacity;
      if (amount >= cellCapacity) {
        deductCapacity = cellCapacity;
      } else {
        deductCapacity = cellCapacity - minimalCellCapacity(output);
        if (deductCapacity > amount) {
          deductCapacity = amount;
        }
      }
      amount -= deductCapacity;
      output.cell_output.capacity =
        "0x" + (cellCapacity - deductCapacity).toString(16);
    }
  }
  // remove all output cells with capacity equal to 0
  txSkeleton = txSkeleton.update("outputs", (outputs) => {
    return outputs.filter(
      (output) => BigInt(output.cell_output.capacity) !== BigInt(0)
    );
  });
  /*
   * Collect and add new input cells so as to prepare remaining capacities.
   */
  if (amount > 0) {
    const cellProvider = txSkeleton.get("cellProvider");
    if (!cellProvider) {
      throw new Error("cell provider is missing!");
    }

    const changeCell = {
      cell_output: {
        capacity: "0x0",
        lock: fromScript,
        type: null,
      },
      data: "0x",
      out_point: null,
      block_hash: null,
    };
    let changeCapacity = BigInt(0);

    for await (const inputCellInfo of collectCells(cellProvider, fromScript)) {
      if (
        !checkSinceValid(inputCellInfo.since, tipHeader, inputCellInfo.header)
      ) {
        continue;
      }

      const inputCell = inputCellInfo.cell;
      txSkeleton = txSkeleton.update("inputs", (inputs) =>
        inputs.push(inputCell)
      );
      if (isDaoScript(inputCell.cell_output.type, config)) {
        txSkeleton = txSkeleton.update("headerDeps", (headerDeps) => {
          return headerDeps.push(
            inputCellInfo.depositBlockHash,
            inputCellInfo.withdrawBlockHash
          );
        });

        const depositHeaderDepIndex = txSkeleton.get("headerDeps").size - 2;

        txSkeleton = txSkeleton.update("witnesses", (witnesses) => {
          const witnessArgs = {
            input_type: toBigUInt64LE(depositHeaderDepIndex),
          };
          return witnesses.push(
            new Reader(
              core.SerializeWitnessArgs(
                normalizers.NormalizeWitnessArgs(witnessArgs)
              )
            ).serializeJson()
          );
        });

        // add dao cell dep
        const template = config.SCRIPTS.DAO;
        txSkeleton = addCellDep(txSkeleton, {
          dep_type: template.dep_type,
          out_point: template.out_point,
        });
      } else {
        txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
          witnesses.push("0x")
        );
      }
      const inputCapacity = BigInt(inputCellInfo.maximumCapacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > amount) {
        deductCapacity = amount;
      }
      amount -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;

      if (isSecp256k1Blake160Script(fromScript, config)) {
        txSkeleton = await setupInputCell(
          txSkeleton,
          txSkeleton.get("inputs").size - 1,
          { config }
        );
      } else {
        // multisig
        txSkeleton = await setupMultisigInputCell(
          txSkeleton,
          txSkeleton.get("inputs").size - 1,
          fromInfo,
          { config }
        );
      }

      if (
        amount === BigInt(0) &&
        (changeCapacity === BigInt(0) ||
          changeCapacity > minimalCellCapacity(changeCell))
      ) {
        break;
      }
    }
    if (changeCapacity > BigInt(0)) {
      changeCell.cell_output.capacity = "0x" + changeCapacity.toString(16);
      txSkeleton = txSkeleton.update("outputs", (outputs) =>
        outputs.push(changeCell)
      );
    }
  }
  if (amount > 0) {
    throw new Error("Not enough capacity in from address!");
  }

  return txSkeleton;
}

async function payFee(
  txSkeleton,
  fromInfo,
  amount,
  tipHeader,
  { config = LINA } = {}
) {
  return transfer(txSkeleton, fromInfo, null, amount, tipHeader, {
    config,
    requireToAddress: false,
  });
}

function _parseMultisigArgsSince(args) {
  if (args.length !== 58) {
    throw new Error("Invalid multisig with since args!");
  }
  return readBigUInt64LE("0x" + args.slice(42));
}

module.exports = {
  collectCells,
  transfer,
  payFee,
};
