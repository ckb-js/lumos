import {
  PageSizeTooLargeException,
  PageSizeTooSmallException,
  OutputsValidatorTypeException,
  BigintOrHexStringTypeException,
  StringHashTypeException,
  HexStringWithout0xException,
} from "./exceptions";
import { BI } from "@ckb-lumos/bi";
import { RPC } from "./types/rpc";
import { CKBComponents } from "./types/api";

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
export const formatter = {
  toOptional: (format?: (args: any) => any) => (arg: any) => {
    if (!format || arg === undefined || arg === null) {
      return arg;
    }
    return format(arg);
  },
  toArray: (format?: (args: any) => any) => (arg: any) => {
    if (typeof format !== "function" || !Array.isArray(arg)) {
      return arg;
    }
    return arg.map(format);
  },
  toHash: (hash: string): RPC.Hash256 => {
    if (typeof hash !== "string") {
      throw new StringHashTypeException(hash);
    }
    return hash.startsWith("0x") ? hash : `0x${hash}`;
  },
  toNumber: (number: CKBComponents.Number | bigint): RPC.Number => {
    if (typeof number === "bigint") {
      return `0x${number.toString(16)}`;
    }
    if (typeof number !== "string") {
      throw new BigintOrHexStringTypeException(number);
    }
    if (!number.startsWith("0x")) {
      throw new HexStringWithout0xException(number);
    }
    return number;
  },
  toScript: (script: CKBComponents.Script): RPC.Script => {
    const { codeHash, hashType: hash_type, ...rest } = script;
    return {
      code_hash: formatter.toHash(codeHash),
      hash_type,
      ...rest,
    };
  },
  toOutPoint: (outPoint: CKBComponents.OutPoint): RPC.OutPoint => {
    const { txHash, index, ...rest } = outPoint;
    return {
      tx_hash: formatter.toHash(txHash),
      index: formatter.toNumber(index),
      ...rest,
    };
  },
  toInput: (input: CKBComponents.CellInput): RPC.CellInput => {
    if (!input) return input;
    const { previousOutput, since, ...rest } = input;
    return {
      previous_output: formatter.toOutPoint(previousOutput),
      since: formatter.toNumber(since),
      ...rest,
    };
  },
  toOutput: (output: CKBComponents.CellOutput): RPC.CellOutput => {
    if (!output) return output;
    const { capacity, lock, type = undefined, ...rest } = output;
    return {
      capacity: formatter.toNumber(capacity),
      lock: formatter.toScript(lock),
      type: type ? formatter.toScript(type) : type,
      ...rest,
    };
  },
  toDepType: (type: CKBComponents.DepType) => {
    if (type === "depGroup") {
      return "dep_group";
    }
    return type;
  },
  toOrder: (order: CKBComponents.Order) => {
    return order;
  },
  toCellDep: (cellDep: CKBComponents.CellDep): RPC.CellDep => {
    if (!cellDep) return cellDep;
    const { outPoint, depType = "code", ...rest } = cellDep;
    return {
      out_point: formatter.toOutPoint(outPoint),
      dep_type: formatter.toDepType(depType),
      ...rest,
    };
  },
  toRawTransaction: (
    transaction: CKBComponents.RawTransaction
  ): RPC.RawTransaction => {
    if (!transaction) return transaction;
    const {
      version,
      cellDeps = [],
      inputs = [],
      outputs = [],
      outputsData: outputs_data = [],
      headerDeps: header_deps = [],
      ...rest
    } = transaction;
    const formattedInputs = inputs.map((input) => formatter.toInput(input));
    const formattedOutputs = outputs.map((output) =>
      formatter.toOutput(output)
    );
    const formattedCellDeps = cellDeps.map((cellDep) =>
      formatter.toCellDep(cellDep)
    );
    const tx = {
      version: formatter.toNumber(version),
      cell_deps: formattedCellDeps,
      inputs: formattedInputs,
      outputs: formattedOutputs,
      outputs_data,
      header_deps,
      ...rest,
    };
    return tx;
  },
  toPageNumber: (pageNo: string | bigint = "0x1") => formatter.toNumber(pageNo),
  toPageSize: (pageSize: string | bigint = "0x32") => {
    const size = BI.from(pageSize);
    const MAX_SIZE = 50;
    const MIN_SIZE = 0;
    if (BI.from(size).gt(MAX_SIZE))
      throw new PageSizeTooLargeException(pageSize, MAX_SIZE);
    if (BI.from(size).lt(MIN_SIZE))
      throw new PageSizeTooSmallException(pageSize, MIN_SIZE);
    return formatter.toNumber(`0x${size.toString(16)}`);
  },
  toReverseOrder: (reverse = false) => !!reverse,
  toOutputsValidator: (outputsValidator: CKBComponents.OutputsValidator) => {
    if (!outputsValidator) return undefined;
    const VALIDATORS = ["default", "passthrough"];
    if (VALIDATORS.indexOf(outputsValidator) > -1) {
      return outputsValidator;
    }
    throw new OutputsValidatorTypeException();
  },
  toBoolean: (value: boolean) => {
    return !!value;
  },
  toTransactionProof: (
    proof: CKBComponents.TransactionProof
  ): RPC.TransactionProof => {
    if (!proof) return proof;
    const {
      blockHash: block_hash,
      witnessesRoot: witnesses_root,
      ...rest
    } = proof;
    return {
      block_hash,
      witnesses_root,
      ...rest,
    };
  },
  toSearchFilter: (data: CKBComponents.SearchFilter): RPC.SearchFilter => {
    if (!data) return data;
    return {
      script: data.script ? formatter.toScript(data.script) : data.script,
      output_data_len_range: data.outputDataLenRange,
      output_capacity_range: data.outputCapacityRange,
      block_range: data.blockRange,
      script_len_range: data.scriptLenRange,
    };
  },
  toSearchKey: (data: CKBComponents.SearchKey): RPC.SearchKey => {
    if (!data) return data;
    return {
      script: formatter.toScript(data.script),
      script_type: data.scriptType,
      filter: data.filter ? formatter.toSearchFilter(data.filter) : data.filter,
    };
  },
  toGetCellsSearchKey: (
    data: CKBComponents.GetCellsSearchKey
  ): RPC.GetCellsSearchKey => {
    if (!data) return data;
    return {
      ...formatter.toSearchKey(data),
      with_data: data.withData,
    };
  },
  toGetTransactionsSearchKey: (
    data: CKBComponents.GetTransactionsSearchKey
  ): RPC.GetTransactionsSearchKey => {
    if (!data) return data;
    return {
      ...formatter.toSearchKey(data),
      group_by_transaction: data.groupByTransaction,
    };
  },
};
/* eslint-enable camelcase, @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types */
