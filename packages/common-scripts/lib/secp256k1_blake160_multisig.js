const {
  configs,
  parseAddress,
  minimalCellCapacity,
  createTransactionFromSkeleton,
  generateAddress,
} = require("@ckb-lumos/helpers");
const { LINA } = configs;
const { core, values, utils } = require("@ckb-lumos/base");
const { CKBHasher, ckbHash } = utils;
const { ScriptValue } = values;
const { normalizers, Reader } = require("ckb-js-toolkit");
const { Set } = require("immutable");

// 65 bytes zeros
const SIGNATURE_PLACEHOLDER =
  "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

function ensureSecp256k1Blake160Multisig(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT;
  if (
    template.code_hash !== script.code_hash ||
    template.hash_type !== script.hash_type
  ) {
    throw new Error(
      "Provided script is not SECP256K1_BLAKE160_MULTISIG script!"
    );
  }
}

function serializeMultisigScript({ R, M, publicKeyHashes }) {
  if (R < 0 || R > 255) {
    throw new Error("`R` should be less than 256!");
  }
  if (M < 0 || M > 255) {
    throw new Error("`M` should be less than 256!");
  }
  // TODO: validate publicKeyHashes
  return (
    "0x00" +
    ("00" + R.toString(16)).slice(-2) +
    ("00" + M.toString(16)).slice(-2) +
    ("00" + publicKeyHashes.length.toString(16)).slice(-2) +
    publicKeyHashes.map((h) => h.slice(2)).join("")
  );
}

function multisigArgs(serializedMultisigScript, since = "0x") {
  return (
    new CKBHasher().update(serializedMultisigScript).digestHex().slice(0, 42) +
    since.slice(2)
  );
}

async function transfer(
  txSkeleton,
  fromInfo,
  toAddress,
  amount,
  { config = LINA, requireToAddress = true }
) {
  if (!config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE16_MULTISIG script setup!"
    );
  }

  const cellDep = txSkeleton.get("cellDeps").find((cellDep) => {
    return (
      cellDep.dep_type ===
        config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.DEP_TYPE &&
      new values.OutPointValue(cellDep.out_point, { validate: false }).equals(
        new values.OutPointValue(
          config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.OUT_POINT,
          {
            validate: false,
          }
        )
      )
    );
  });

  if (!cellDep) {
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.OUT_POINT,
        dep_type: config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.DEP_TYPE,
      });
    });
  }

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

  ensureSecp256k1Blake160Multisig(fromScript, config);

  const noMultisigBefore = !txSkeleton.get("inputs").find((i) => {
    return new ScriptValue(i.cell_output.lock, { validate: false }).equals(
      new ScriptValue(fromScript, { validate: false })
    );
  });

  if (noMultisigBefore && fromInfo === "string") {
    throw new Error("MultisigScript is required for witness!");
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
    // TODO: ignore locktime now.
    const cellCollector = cellProvider.collector({
      lock: fromScript,
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
    for await (const inputCell of cellCollector.collect()) {
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
  if (amount > 0) {
    throw new Error("Not enough capacity in from address!");
  }

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

    // if using MultisigScript, check witnesses
    if (noMultisigBefore || typeof fromInfo !== "string") {
      let witness = txSkeleton.get("witnesses").get(firstIndex);
      const newWitnessArgs = {
        lock:
          "0x" +
          multisigScript.slice(2) +
          SIGNATURE_PLACEHOLDER.slice(2).repeat(fromInfo.M),
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
            inputType.values().raw()
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
  }
  return txSkeleton;
}

async function payFee(txSkeleton, fromInfo, amount, { config = LINA } = {}) {
  return transfer(txSkeleton, fromInfo, null, amount, {
    config,
    requireToAddress: false,
  });
}

async function injectCapacity(
  txSkeleton,
  outputIndex,
  fromInfo,
  { config = LINA } = {}
) {
  if (outputIndex >= txSkeleton.get("outputs").size) {
    throw new Error("Invalid output index!");
  }
  const capacity = BigInt(
    txSkeleton.get("outputs").get(outputIndex).cell_output.capacity
  );
  return transfer(txSkeleton, fromInfo, null, capacity, {
    config,
    requireToAddress: false,
  });
}

async function setupInputCell(
  txSkeleton,
  inputIndex,
  fromInfo,
  { config = LINA } = {}
) {
  if (inputIndex >= txSkeleton.get("inputs").size) {
    throw new Error("Invalid input index!");
  }
  const inputLock = txSkeleton.get("inputs").get(inputIndex).cell_output.lock;
  const fromAddress = generateAddress(inputLock, { config });
  return transfer(txSkeleton, fromInfo || fromAddress, null, 0, {
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

function prepareSigningEntries(txSkeleton, { config = LINA } = {}) {
  if (!config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG) {
    throw new Error(
      "Provided config does not have SECP256K1_BLAKE160_MULTISIG script setup!"
    );
  }
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG.SCRIPT;
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
      template.code_hash === input.cell_output.lock.code_hash &&
      template.hash_type === input.cell_output.lock.hash_type &&
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
  serializeMultisigScript,
  multisigArgs,
  injectCapacity,
  setupInputCell,
};
