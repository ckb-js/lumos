const {
  parseAddress,
  minimalCellCapacity,
  createTransactionFromSkeleton,
  generateAddress,
} = require("@ckb-lumos/helpers");
const { core, values, utils } = require("@ckb-lumos/base");
const { getConfig } = require("@ckb-lumos/config-manager");
const { CKBHasher, ckbHash } = utils;
const { ScriptValue } = values;
const { normalizers, Reader } = require("ckb-js-toolkit");
const { Set } = require("immutable");

const SIGNATURE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

function ensureSecp256k1Script(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160;
  if (
    template.CODE_HASH !== script.code_hash ||
    template.HASH_TYPE !== script.hash_type
  ) {
    throw new Error("Provided script is not SECP256K1_BLAKE160 script!");
  }
}

async function transfer(
  txSkeleton,
  fromAddress,
  toAddress,
  amount,
  {
    config = undefined,
    requireToAddress = true,
    assertAmountEnough = true,
    queryOptions = {},
  } = {}
) {
  config = config || getConfig();
  if (!config.SCRIPTS.SECP256K1_BLAKE160) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE160 script setup!"
    );
  }
  const scriptOutPoint = {
    tx_hash: config.SCRIPTS.SECP256K1_BLAKE160.TX_HASH,
    index: config.SCRIPTS.SECP256K1_BLAKE160.INDEX,
  };

  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.dep_type === config.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE &&
      new values.OutPointValue(cellDep.out_point, { validate: false }).equals(
        new values.OutPointValue(scriptOutPoint, {
          validate: false,
        })
      )
    );
  });
  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: scriptOutPoint,
        dep_type: config.SCRIPTS.SECP256K1_BLAKE160.DEP_TYPE,
      });
    });
  }

  const fromScript = parseAddress(fromAddress, { config });
  ensureSecp256k1Script(fromScript, config);

  if (requireToAddress && !toAddress) {
    throw new Error("You must provide a to address!");
  }

  amount = BigInt(amount);
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

  /*
   * First, check if there is any output cells that contains enough capacity
   * for us to tinker with.
   *
   * TODO: the solution right now won't cover all cases, some outputs before the
   * last output might still be tinkerable, right now we are working on the
   * simple solution, later we can change this for more optimizations.
   */
  const lastFreezedOutput = txSkeleton
    .get("fixedEntries")
    .filter(({ field }) => field === "outputs")
    .maxBy(({ index }) => index);
  let i = lastFreezedOutput ? lastFreezedOutput.index + 1 : 0;
  for (; i < txSkeleton.get("outputs").size && amount > 0; i++) {
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
  // Remove all output cells with capacity equal to 0
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
      throw new Error("Cell provider is missing!");
    }
    const cellCollector = cellProvider.collector({
      lock: fromScript,
      type: queryOptions.type,
      data: queryOptions.data || "0x",
      argsLen: queryOptions.argsLen == null ? -1 : queryOptions.argsLen,
    });
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
      const inputCapacity = BigInt(inputCell.cell_output.capacity);
      let deductCapacity = inputCapacity;
      if (deductCapacity > amount) {
        deductCapacity = amount;
      }
      amount -= deductCapacity;
      changeCapacity += inputCapacity - deductCapacity;
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
  if (amount > 0 && assertAmountEnough) {
    throw new Error("Not enough capacity in from address!");
  }
  /*
   * Modify the skeleton, so the first witness of the fromAddress script group
   * has a WitnessArgs construct with 65-byte zero filled values. While this
   * is not required, it helps in transaction fee estimation.
   */
  const firstIndex = txSkeleton
    .get("inputs")
    .findIndex((input) =>
      new ScriptValue(input.cell_output.lock, { validate: false }).equals(
        new ScriptValue(fromScript, { validate: false })
      )
    );
  if (firstIndex !== -1) {
    while (firstIndex >= txSkeleton.get("witnesses").size) {
      txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
        witnesses.push("0x")
      );
    }
    let witness = txSkeleton.get("witnesses").get(firstIndex);
    const newWitnessArgs = {
      /* 65-byte zeros in hex */
      lock: SIGNATURE_PLACEHOLDER,
    };
    if (witness !== "0x") {
      const witnessArgs = new core.WitnessArgs(new Reader(witness));
      const lock = witnessArgs.getLock();
      if (
        lock.hasValue() &&
        new Reader(lock.value().raw()).serializeJson() !== newWitnessArgs.lock
      ) {
        throw new Error(
          "Lock field in first witness is set aside for signature!"
        );
      }
      const inputType = witnessArgs.getInputType();
      if (inputType.hasValue()) {
        newWitnessArgs.input_type = new Reader(
          inputType.value().raw()
        ).serializeJson();
      }
      const outputType = witnessArgs.getOutputType();
      if (outputType.hasValue()) {
        newWitnessArgs.output_type = new Reader(
          outputType.value().raw()
        ).serializeJson();
      }
    }
    witness = new Reader(
      core.SerializeWitnessArgs(
        normalizers.NormalizeWitnessArgs(newWitnessArgs)
      )
    ).serializeJson();
    txSkeleton = txSkeleton.update("witnesses", (witnesses) =>
      witnesses.set(firstIndex, witness)
    );
  }
  if (!assertAmountEnough) {
    return [txSkeleton, amount];
  }
  return txSkeleton;
}

async function payFee(
  txSkeleton,
  fromAddress,
  amount,
  { config = undefined } = {}
) {
  config = config || getConfig();
  return await transfer(txSkeleton, fromAddress, null, amount, {
    config,
    requireToAddress: false,
  });
}

async function injectCapacity(
  txSkeleton,
  outputIndex,
  fromAddress,
  { config = undefined } = {}
) {
  config = config || getConfig();
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BigInt(
    txSkeleton.get("outputs").get(outputIndex).cell_output.capacity
  );
  return await transfer(txSkeleton, fromAddress, null, capacity, {
    config,
    requireToAddress: false,
  });
}

async function setupInputCell(
  txSkeleton,
  inputIndex,
  { config = undefined } = {}
) {
  config = config || getConfig();
  if (inputIndex >= txSkeleton.get("inputs").size) {
    throw new Error("Invalid input index!");
  }
  const inputLock = txSkeleton.get("inputs").get(inputIndex).cell_output.lock;
  const fromAddress = generateAddress(inputLock, { config });
  return transfer(txSkeleton, fromAddress, null, 0, {
    config,
    requireToAddress: false,
  });
}

function hashWitness(hasher, witness) {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  view.setBigUint64(0, BigInt(new Reader(witness).length()), true);
  hasher.update(lengthBuffer);
  hasher.update(witness);
}

function prepareSigningEntries(txSkeleton, { config = undefined } = {}) {
  config = config || getConfig();
  if (!config.SCRIPTS.SECP256K1_BLAKE160) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE160 script setup!"
    );
  }
  const template = config.SCRIPTS.SECP256K1_BLAKE160;
  let processedArgs = Set();
  const tx = createTransactionFromSkeleton(txSkeleton);
  const txHash = ckbHash(
    core.SerializeRawTransaction(normalizers.NormalizeRawTransaction(tx))
  ).serializeJson();
  const inputs = txSkeleton.get("inputs");
  const witnesses = txSkeleton.get("witnesses");
  let signingEntries = txSkeleton.get("signingEntries");
  for (let i = 0; i < inputs.size; i++) {
    const input = inputs.get(i);
    if (
      template.CODE_HASH === input.cell_output.lock.code_hash &&
      template.HASH_TYPE === input.cell_output.lock.hash_type &&
      !processedArgs.has(input.cell_output.lock.args)
    ) {
      processedArgs = processedArgs.add(input.cell_output.lock.args);
      const lockValue = new values.ScriptValue(input.cell_output.lock, {
        validate: false,
      });
      const hasher = new CKBHasher();
      hasher.update(txHash);
      if (i >= witnesses.size) {
        throw new Error(
          `The first witness in the script group starting at input index ${i} does not exist, maybe some other part has invalidly tampered the transaction?`
        );
      }
      hashWitness(hasher, witnesses.get(i));
      for (let j = i + 1; j < inputs.size && j < witnesses.size; j++) {
        const otherInput = inputs.get(j);
        if (
          lockValue.equals(
            new values.ScriptValue(otherInput.cell_output.lock, {
              validate: false,
            })
          )
        ) {
          hashWitness(hasher, witnesses.get(j));
        }
      }
      for (let j = inputs.size; j < witnesses.size; j++) {
        hashWitness(hasher, witnesses.get(j));
      }
      const signingEntry = {
        type: "witness_args_lock",
        index: i,
        message: hasher.digestHex(),
      };
      signingEntries = signingEntries.push(signingEntry);
    }
  }
  txSkeleton = txSkeleton.set("signingEntries", signingEntries);
  return txSkeleton;
}

module.exports = {
  transfer,
  payFee,
  prepareSigningEntries,
  injectCapacity,
  setupInputCell,
};
