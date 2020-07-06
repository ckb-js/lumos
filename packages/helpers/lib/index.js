"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sealTransaction = exports.createTransactionFromSkeleton = exports.TransactionSkeleton = exports.parseAddress = exports.generateAddress = exports.locateCellDep = exports.minimalCellCapacity = void 0;
const base_1 = require("@ckb-lumos/base");
const bech32 = require("bech32");
const ckb_js_toolkit_1 = require("ckb-js-toolkit");
const immutable_1 = require("immutable");
const config_manager_1 = require("@ckb-lumos/config-manager");
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
        ckb_js_toolkit_1.validators.ValidateCellOutput(fullCell.cell_output);
    }
    // Capacity field itself
    let bytes = 8;
    bytes += new ckb_js_toolkit_1.Reader(fullCell.cell_output.lock.code_hash).length();
    bytes += new ckb_js_toolkit_1.Reader(fullCell.cell_output.lock.args).length();
    // hash_type field
    bytes += 1;
    if (fullCell.cell_output.type) {
        bytes += new ckb_js_toolkit_1.Reader(fullCell.cell_output.type.code_hash).length();
        bytes += new ckb_js_toolkit_1.Reader(fullCell.cell_output.type.args).length();
        bytes += 1;
    }
    if (fullCell.data) {
        bytes += new ckb_js_toolkit_1.Reader(fullCell.data).length();
    }
    return BigInt(bytes) * BigInt(100000000);
}
exports.minimalCellCapacity = minimalCellCapacity;
function locateCellDep(script, { config = undefined } = {}) {
    config = config || config_manager_1.getConfig();
    const scriptTemplate = Object.values(config.SCRIPTS).find((s) => s.CODE_HASH === script.code_hash && s.HASH_TYPE === script.hash_type);
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
exports.locateCellDep = locateCellDep;
function generateAddress(script, { config = undefined } = {}) {
    config = config || config_manager_1.getConfig();
    const scriptTemplate = Object.values(config.SCRIPTS).find((s) => s.CODE_HASH === script.code_hash && s.HASH_TYPE === script.hash_type);
    const data = [];
    if (scriptTemplate && scriptTemplate.SHORT_ID !== undefined) {
        data.push(1, scriptTemplate.SHORT_ID);
        data.push(...hexToByteArray(script.args));
    }
    else {
        data.push(script.hash_type === "type" ? 4 : 2);
        data.push(...hexToByteArray(script.code_hash));
        data.push(...hexToByteArray(script.args));
    }
    const words = bech32.toWords(data);
    return bech32.encode(config.PREFIX, words, BECH32_LIMIT);
}
exports.generateAddress = generateAddress;
function parseAddress(address, { config = undefined } = {}) {
    config = config || config_manager_1.getConfig();
    const { prefix, words } = bech32.decode(address, BECH32_LIMIT);
    if (prefix !== config.PREFIX) {
        throw Error(`Invalid prefix! Expected: ${config.PREFIX}, actual: ${prefix}`);
    }
    const data = bech32.fromWords(words);
    switch (data[0]) {
        case 1:
            if (data.length < 2) {
                throw Error(`Invalid payload length!`);
            }
            const scriptTemplate = Object.values(config.SCRIPTS).find((s) => s.SHORT_ID === data[1]);
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
exports.parseAddress = parseAddress;
exports.TransactionSkeleton = immutable_1.Record({
    cellProvider: null,
    cellDeps: immutable_1.List(),
    headerDeps: immutable_1.List(),
    inputs: immutable_1.List(),
    outputs: immutable_1.List(),
    witnesses: immutable_1.List(),
    fixedEntries: immutable_1.List(),
    signingEntries: immutable_1.List(),
    inputSinces: immutable_1.Map(),
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
        ckb_js_toolkit_1.validators.ValidateTransaction(tx);
    }
    return tx;
}
exports.createTransactionFromSkeleton = createTransactionFromSkeleton;
function sealTransaction(txSkeleton, sealingContents) {
    const tx = createTransactionFromSkeleton(txSkeleton);
    if (sealingContents.length !== txSkeleton.get("signingEntries").size) {
        throw new Error(`Requiring ${txSkeleton.get("signingEntries").size} sealing contents but provided ${sealingContents.length}!`);
    }
    txSkeleton.get("signingEntries").forEach((e, i) => {
        switch (e.type) {
            case "witness_args_lock":
                const witness = tx.witnesses[e.index];
                const witnessArgs = new base_1.core.WitnessArgs(new ckb_js_toolkit_1.Reader(witness));
                const newWitnessArgs = {
                    lock: sealingContents[i],
                };
                const inputType = witnessArgs.getInputType();
                if (inputType.hasValue()) {
                    newWitnessArgs.input_type = new ckb_js_toolkit_1.Reader(inputType.value().raw()).serializeJson();
                }
                const outputType = witnessArgs.getOutputType();
                if (outputType.hasValue()) {
                    newWitnessArgs.output_type = new ckb_js_toolkit_1.Reader(outputType.value().raw()).serializeJson();
                }
                ckb_js_toolkit_1.validators.ValidateWitnessArgs(newWitnessArgs);
                tx.witnesses[e.index] = new ckb_js_toolkit_1.Reader(base_1.core.SerializeWitnessArgs(ckb_js_toolkit_1.normalizers.NormalizeWitnessArgs(newWitnessArgs))).serializeJson();
                break;
            default:
                throw new Error(`Invalid signing entry type: ${e.type}`);
        }
    });
    return tx;
}
exports.sealTransaction = sealTransaction;
