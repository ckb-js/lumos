import { List, Record } from "immutable";
import {
  Cell,
  CellDep,
  CellProvider,
  Script,
  Address,
  Transaction,
  HexString,
} from "@ckb-lumos/base";
import { Config } from "@ckb-lumos/config-manager";

export declare type TransactionSkeletonType = Record.Factory<{
  cellProvider: CellProvider | null;
  cellDeps: List<CellDep>;
  headerDeps: List<string>;
  inputs: List<Cell>;
  outputs: List<Cell>;
  witnesses: List<string>;
  fixedEntries: List<{ field: string; index: number }>;
  signingEntries: List<{ type: string; index: number; message: string }>;
  inputSinces: Map<number, string>;
}>;

export declare function TransactionSkeleton(
  params: any
): TransactionSkeletonType;

export interface Options {
  config?: Config;
}

export declare function locateCellDep(
  script: Script,
  options?: Options
): CellDep | null;

export declare function minimalCellCapacity(
  fullCell: Cell,
  options?: { validate?: boolean }
): bigint;

export declare function generateAddress(
  script: Script,
  options?: Options
): Address;

export declare function parseAddress(
  address: Address,
  options?: Options
): Script;

export declare function createTransactionFromSkeleton(
  txSkeleton: TransactionSkeletonType,
  options?: { validate?: boolean }
): Transaction;

export declare function sealTransaction(
  txSkeleton: TransactionSkeletonType,
  sealingContents: HexString[]
): Transaction;
