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
import { bech32, bech32m } from "bech32";
import { normalizers, validators, Reader } from "@ckb-lumos/toolkit";
import { List, Record, Map as ImmutableMap } from "immutable";
import { getConfig, Config } from "@ckb-lumos/config-manager";
import { BI } from "@ckb-lumos/bi";

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
  const result = minimalCellCapacityCompatible(fullCell, { validate });
  return BigInt(result.toString());
}

export function minimalCellCapacityCompatible(
  fullCell: Cell,
  { validate = true }: { validate?: boolean } = {}
): BI {
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
  return BI.from(bytes).mul(100000000);
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

export const scriptToAddress = generateAddress;

function generatePredefinedAddress(
  args: HexString,
  scriptType: string,
  { config = undefined }: Options = {}
): Address {
  config = config || getConfig();
  const template = config.SCRIPTS[scriptType]!;
  const script: Script = {
    code_hash: template.CODE_HASH,
    hash_type: template.HASH_TYPE,
    args,
  };

  return generateAddress(script, { config });
}

export function generateSecp256k1Blake160Address(
  args: HexString,
  { config = undefined }: Options = {}
): Address {
  return generatePredefinedAddress(args, "SECP256K1_BLAKE160", { config });
}

export function generateSecp256k1Blake160MultisigAddress(
  args: HexString,
  { config = undefined }: Options = {}
): Address {
  return generatePredefinedAddress(args, "SECP256K1_BLAKE160_MULTISIG", {
    config,
  });
}

function trySeries<T extends (...args: unknown[]) => unknown>(
  ...fns: T[]
): ReturnType<T> {
  let latestCatch: unknown;
  for (let fn of fns) {
    try {
      return fn() as ReturnType<T>;
    } catch (e) {
      latestCatch = e;
    }
  }
  throw latestCatch;
}

export function parseAddress(
  address: Address,
  { config = undefined }: Options = {}
): Script {
  config = config || getConfig();
  const { prefix, words } = trySeries(
    () => bech32m.decode(address, BECH32_LIMIT),
    () => bech32.decode(address, BECH32_LIMIT)
  );
  if (prefix !== config.PREFIX) {
    throw Error(
      `Invalid prefix! Expected: ${config.PREFIX}, actual: ${prefix}`
    );
  }
  const data = trySeries(
    () => bech32m.fromWords(words),
    () => bech32.fromWords(words)
  );
  switch (data[0]) {
    case 0:
      //  1 +   32     +    1
      // 00  code_hash  hash_type
      if (data.length < 34) {
        throw new Error(`Invalid payload length!`);
      }
      const serializedHashType = data.slice(33, 34)[0];
      return {
        code_hash: byteArrayToHex(data.slice(1, 33)),
        hash_type: (() => {
          if (serializedHashType === 0) return "data" as const;
          if (serializedHashType === 1) return "type" as const;
          if (serializedHashType === 2) return "data1" as const;

          throw new Error(`unknown hash_type ${serializedHashType}`);
        })(),
        args: byteArrayToHex(data.slice(34)),
      };
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

export const addressToScript = parseAddress;

export function encodeToAddress(
  script: Script,
  { config = undefined }: Options = {}
): Address {
  config = config || getConfig();

  const data: number[] = [];

  const hash_type = (() => {
    if (script.hash_type === "data") return 0;
    if (script.hash_type === "type") return 1;
    if (script.hash_type === "data1") return 2;

    throw new Error(`unknown hash_type ${script.hash_type}`);
  })();

  data.push(0x00);
  data.push(...hexToByteArray(script.code_hash));
  data.push(hash_type);
  data.push(...hexToByteArray(script.args));

  return bech32m.encode(config.PREFIX, bech32m.toWords(data), BECH32_LIMIT);
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
  inputSinces: ImmutableMap<number, PackedSince>;
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
  inputSinces: ImmutableMap(),
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

export interface TransactionSkeletonObject {
  cellProvider: CellProvider | null;
  cellDeps: CellDep[];
  headerDeps: Hash[];
  inputs: Cell[];
  outputs: Cell[];
  witnesses: HexString[];
  fixedEntries: Array<{ field: string; index: number }>;
  signingEntries: Array<{ type: string; index: number; message: string }>;
  inputSinces: Map<number, PackedSince>;
}

/**
 * Convert TransactionSkeleton to js object
 *
 * @param txSkelton
 */
export function transactionSkeletonToObject(
  txSkelton: TransactionSkeletonType
): TransactionSkeletonObject {
  return txSkelton.toJS();
}

/**
 * Convert js object to TransactionSkeleton
 *
 * @param obj
 */
export function objectToTransactionSkeleton(
  obj: TransactionSkeletonObject
): TransactionSkeletonType {
  let inputSinces = ImmutableMap<number, PackedSince>();
  for (const [key, value] of Object.entries(obj.inputSinces)) {
    inputSinces = inputSinces.set(+key, value);
  }
  const txSkeleton = TransactionSkeleton({
    cellProvider: obj.cellProvider,
    cellDeps: List(obj.cellDeps),
    headerDeps: List(obj.headerDeps),
    inputs: List(obj.inputs),
    outputs: List(obj.outputs),
    witnesses: List(obj.witnesses),
    fixedEntries: List(obj.fixedEntries),
    signingEntries: List(obj.signingEntries),
    inputSinces,
  });
  return txSkeleton;
}
