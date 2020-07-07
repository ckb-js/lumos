import {
  core,
  HexString,
  Cell,
  Script,
  CellDep,
  Address,
  CellProvider,
  Hash,
  PackedSince,
  Transaction,
  WitnessArgs,
} from "@ckb-lumos/base";
import * as bech32 from "bech32";
import { normalizers, validators, Reader } from "ckb-js-toolkit";
import { List, Record, Map } from "immutable";
import { getConfig, Config } from "@ckb-lumos/config-manager";

export interface Options {
  config?: Config;
}

const BECH32_LIMIT = 1023;

function byteArrayToHex(a: number[]): HexString {
  return "0x" + a.map((i) => ("00" + i.toString(16)).slice(-2)).join("");
}

function hexToByteArray(h: HexString): number[] {
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

export function minimalCellCapacity(
  fullCell: Cell,
  { validate = true }: { validate?: boolean } = {}
): bigint {
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

export function locateCellDep(
  script: Script,
  { config = undefined }: Options = {}
): CellDep | null {
  config = config || getConfig();
  const scriptTemplate = Object.values(config.SCRIPTS).find(
    (s) =>
      s!.CODE_HASH === script.code_hash && s!.HASH_TYPE === script.hash_type
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

export function generateAddress(
  script: Script,
  { config = undefined }: Options = {}
): Address {
  config = config || getConfig();
  const scriptTemplate = Object.values(config.SCRIPTS).find(
    (s) =>
      s!.CODE_HASH === script.code_hash && s!.HASH_TYPE === script.hash_type
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

export function parseAddress(
  address: Address,
  { config = undefined }: Options = {}
): Script {
  config = config || getConfig();
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
        (s) => s!.SHORT_ID === data[1]
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

export interface TransactionSkeletonInterface {
  cellProvider: CellProvider | null;
  cellDeps: List<CellDep>;
  headerDeps: List<Hash>;
  inputs: List<Cell>;
  outputs: List<Cell>;
  witnesses: List<HexString>;
  fixedEntries: List<{ field: string; index: number }>;
  signingEntries: List<{ type: string; index: number; message: string }>;
  inputSinces: Map<number, PackedSince>;
}

export type TransactionSkeletonType = Record<TransactionSkeletonInterface> &
  Readonly<TransactionSkeletonInterface>;

export const TransactionSkeleton = Record<TransactionSkeletonInterface>({
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

export function createTransactionFromSkeleton(
  txSkeleton: TransactionSkeletonType,
  { validate = true }: { validate?: boolean } = {}
): Transaction {
  const tx: Transaction = {
    version: "0x0",
    cell_deps: txSkeleton.get("cellDeps").toArray(),
    header_deps: txSkeleton.get("headerDeps").toArray(),
    inputs: txSkeleton
      .get("inputs")
      .map((input, i) => {
        return {
          since: txSkeleton.get("inputSinces").get(i, "0x0"),
          previous_output: input.out_point!,
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

export function sealTransaction(
  txSkeleton: TransactionSkeletonType,
  sealingContents: HexString[]
): Transaction {
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
        const newWitnessArgs: WitnessArgs = {
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
