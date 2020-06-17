const { core } = require("@ckb-lumos/base");
const bech32 = require("bech32");
const { normalizers, validators, Reader } = require("ckb-js-toolkit");
const { List, Record, Map } = require("immutable");
const { predefined } = require("@ckb-lumos/config-manager");
const { LINA } = predefined;

const BECH32_LIMIT = 1023;

function byteArrayToHex(a) {
  return "0x" + a.map((i) => ("00" + i.toString(16)).slice(-2)).join("");
}

function hexToByteArray(h) {
  if (!/^(0x)?([0-9a-fA-F][0-9a-fA-F])*$/.test(h)) {
    throw new Error("Invalid hex string!");
  }
  if (h.startsWith("0x")) {
    h = h.slice(2);
  }
  const array = [];
  while (h.length >= 2) {
    array.push(parseInt(h.slice(0, 2), 16));
    h = h.slice(2);
  }
  return array;
}

function minimalCellCapacity(fullCell, { validate = true } = {}) {
  if (validate) {
    validators.ValidateCellOutput(fullCell.cell_output);
  }
  // Capacity field itself
  let bytes = 8;
  bytes += new Reader(fullCell.cell_output.lock.code_hash).length();
  bytes += new Reader(fullCell.cell_output.lock.args).length();
  // hash_type field
  bytes += 1;
  if (fullCell.cell_output.type) {
    bytes += new Reader(fullCell.cell_output.type.code_hash).length();
    bytes += new Reader(fullCell.cell_output.type.args).length();
    bytes += 1;
  }
  if (fullCell.data) {
    bytes += new Reader(fullCell.data).length();
  }
  return BigInt(bytes) * BigInt(100000000);
}

function locateCellDep(script, { config = LINA } = {}) {
  const scriptTemplate = Object.values(config.SCRIPTS).find(
    (s) => s.CODE_HASH === script.code_hash && s.HASH_TYPE === script.hash_type
  );
  if (scriptTemplate) {
    return {
      dep_type: scriptTemplate.DEP_TYPE,
      out_point: {
        tx_hash: scriptTemplate.TX_HASH,
        index: scriptTemplate.INDEX,
      },
    };
  }
  return null;
}

function generateAddress(script, { config = LINA } = {}) {
  const scriptTemplate = Object.values(config.SCRIPTS).find(
    (s) => s.CODE_HASH === script.code_hash && s.HASH_TYPE === script.hash_type
  );
  const data = [];
  if (scriptTemplate && scriptTemplate.SHORT_ID !== undefined) {
    data.push(1, scriptTemplate.SHORT_ID);
    data.push(...hexToByteArray(script.args));
  } else {
    data.push(script.hash_type === "type" ? 4 : 2);
    data.push(...hexToByteArray(script.code_hash));
    data.push(...hexToByteArray(script.args));
  }
  const words = bech32.toWords(data);
  return bech32.encode(config.PREFIX, words, BECH32_LIMIT);
}

function parseAddress(address, { config = LINA } = {}) {
  const { prefix, words } = bech32.decode(address, BECH32_LIMIT);
  if (prefix !== config.PREFIX) {
    throw Error(
      `Invalid prefix! Expected: ${config.PREFIX}, actual: ${prefix}`
    );
  }
  const data = bech32.fromWords(words);
  switch (data[0]) {
    case 1:
      if (data.length < 2) {
        throw Error(`Invalid payload length!`);
      }
      const scriptTemplate = Object.values(config.SCRIPTS).find(
        (s) => s.SHORT_ID === data[1]
      );
      if (!scriptTemplate) {
        throw Error(`Invalid code hash index: ${data[1]}!`);
      }
      return {
        code_hash: scriptTemplate.CODE_HASH,
        hash_type: scriptTemplate.HASH_TYPE,
        args: byteArrayToHex(data.slice(2)),
      };
    case 2:
      if (data.length < 33) {
        throw Error(`Invalid payload length!`);
      }
      return {
        code_hash: byteArrayToHex(data.slice(1, 33)),
        hash_type: "data",
        args: byteArrayToHex(data.slice(33)),
      };
    case 4:
      if (data.length < 33) {
        throw Error(`Invalid payload length!`);
      }
      return {
        code_hash: byteArrayToHex(data.slice(1, 33)),
        hash_type: "type",
        args: byteArrayToHex(data.slice(33)),
      };
  }
  throw Error(`Invalid payload format type: ${data[0]}`);
}

const TransactionSkeleton = Record({
  cellProvider: null,
  cellDeps: List(),
  headerDeps: List(),
  inputs: List(),
  outputs: List(),
  witnesses: List(),
  fixedEntries: List(),
  signingEntries: List(),
  inputSinces: Map(),
});

function createTransactionFromSkeleton(txSkeleton, { validate = true } = {}) {
  const tx = {
    version: "0x0",
    cell_deps: txSkeleton.get("cellDeps").toArray(),
    header_deps: txSkeleton.get("headerDeps").toArray(),
    inputs: txSkeleton
      .get("inputs")
      .map((input, i) => {
        return {
          since: txSkeleton.get("inputSinces").get(i, "0x0"),
          previous_output: input.out_point,
        };
      })
      .toArray(),
    outputs: txSkeleton
      .get("outputs")
      .map((output) => output.cell_output)
      .toArray(),
    outputs_data: txSkeleton
      .get("outputs")
      .map((output) => output.data || "0x0")
      .toArray(),
    witnesses: txSkeleton.get("witnesses").toArray(),
  };
  if (validate) {
    validators.ValidateTransaction(tx);
  }
  return tx;
}

function sealTransaction(txSkeleton, sealingContents) {
  const tx = createTransactionFromSkeleton(txSkeleton);
  if (sealingContents.length !== txSkeleton.get("signingEntries").size) {
    throw new Error(
      `Requiring ${
        txSkeleton.get("signingEntries").size
      } sealing contents but provided ${sealingContents.length}!`
    );
  }
  txSkeleton.get("signingEntries").forEach((e, i) => {
    switch (e.type) {
      case "witness_args_lock":
        const witness = tx.witnesses[e.index];
        const witnessArgs = new core.WitnessArgs(new Reader(witness));
        const newWitnessArgs = {
          lock: sealingContents[i],
        };
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
        validators.ValidateWitnessArgs(newWitnessArgs);
        tx.witnesses[e.index] = new Reader(
          core.SerializeWitnessArgs(
            normalizers.NormalizeWitnessArgs(newWitnessArgs)
          )
        ).serializeJson();
        break;
      default:
        throw new Error(`Invalid signing entry type: ${e.type}`);
    }
  });
  return tx;
}

module.exports = {
  locateCellDep,
  minimalCellCapacity,
  generateAddress,
  parseAddress,
  createTransactionFromSkeleton,
  TransactionSkeleton,
  sealTransaction,
};
