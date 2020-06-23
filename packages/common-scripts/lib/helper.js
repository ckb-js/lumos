const { Set } = require("immutable");
const { createTransactionFromSkeleton } = require("@ckb-lumos/helpers");
const { core, values, utils } = require("@ckb-lumos/base");
const { CKBHasher, ckbHash } = utils;
const { normalizers, Reader } = require("ckb-js-toolkit");

function addCellDep(txSkeleton, newCellDep) {
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

function generateDaoScript(config) {
  const template = config.SCRIPTS.DAO;

  return {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args: "0x",
  };
}

function isSecp256k1Blake160Script(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160;
  return (
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

function isSecp256k1Blake160MultisigScript(script, config) {
  const template = config.SCRIPTS.SECP256K1_BLAKE160_MULTISIG;
  return (
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

function isDaoScript(script, config) {
  const template = config.SCRIPTS.DAO;

  return (
    script &&
    script.code_hash === template.CODE_HASH &&
    script.hash_type === template.HASH_TYPE
  );
}

function hashWitness(hasher, witness) {
  const lengthBuffer = new ArrayBuffer(8);
  const view = new DataView(lengthBuffer);
  view.setBigUint64(0, BigInt(new Reader(witness).length()), true);
  hasher.update(lengthBuffer);
  hasher.update(witness);
}

function prepareSigningEntries(txSkeleton, config, scriptType) {
  const template = config.SCRIPTS[scriptType];
  if (!template) {
    throw new Error(
      `Provided config does not have ${scriptType} script setup!`
    );
  }
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
  addCellDep,
  generateDaoScript,
  isSecp256k1Blake160Script,
  isSecp256k1Blake160MultisigScript,
  isDaoScript,
  prepareSigningEntries,
};
