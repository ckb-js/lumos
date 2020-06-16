import { List, Record } from "immutable";
import { Cell, CellDep, CellProvider } from "@ckb-lumos/base";

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
